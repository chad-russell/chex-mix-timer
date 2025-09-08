import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, StepForward, StepBack, Bell } from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage";
import useDisplayMode from "../hooks/useDisplayMode";

// Type definition for the WakeLockSentinel
interface WakeLockSentinel extends EventTarget {
  release(): Promise<void>;
  readonly type: "screen";
}

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

// HTML5 audio element for alarm sound effect (jingle bells)
const ALARM_AUDIO_SRC = "/audio/stir-it-up.mp3";
let sharedAlarmAudio: HTMLAudioElement | null = null;

function startBeep(enabled: boolean) {
  if (!enabled) return;
  try {
    if (audioContext && oscillator) {
      stopBeep(); // Stop any existing beep before starting a new one
    }

    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.4,
      audioContext.currentTime + 0.01,
    );
    oscillator.start();
  } catch (e) {
    console.error("Error starting beep:", e);
    // Silently ignore audio errors
  }
}

function stopBeep() {
  if (oscillator) {
    try {
      gainNode?.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext!.currentTime + 0.2,
      );
      oscillator.stop(audioContext!.currentTime + 0.22);
      oscillator.disconnect();
      gainNode?.disconnect();
      audioContext?.close();
    } catch (e) {
      console.error("Error stopping beep:", e);
    } finally {
      oscillator = null;
      gainNode = null;
      audioContext = null;
    }
  }
}

function ensureAlarmAudio() {
  if (!sharedAlarmAudio) {
    const el = new Audio(ALARM_AUDIO_SRC);
    el.loop = true;
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.volume = 0.9;
    sharedAlarmAudio = el;
  }
  return sharedAlarmAudio;
}

function waitForPlaying(
  el: HTMLAudioElement,
  timeoutMs = 1200,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const onPlaying = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(true);
    };
    const onTimeUpdate = () => {
      if (settled) return;
      if (el.currentTime > 0 && !el.paused) {
        settled = true;
        cleanup();
        resolve(true);
      }
    };
    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("error", onError);
    };
    el.addEventListener("playing", onPlaying, { once: true });
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("error", onError, { once: true });
    setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(!el.paused && el.currentTime > 0);
    }, timeoutMs);
  });
}

async function startAlarmSound(enabled: boolean): Promise<boolean> {
  if (!enabled) return false;
  try {
    const el = ensureAlarmAudio();
    // ensure volume
    el.volume = 0.9;
    try {
      await el.play();
    } catch (err) {
      // Autoplay likely blocked
      return false;
    }
    const ok = await waitForPlaying(el);
    if (!ok) return false;
    if ("mediaSession" in navigator) {
      try {
        // @ts-ignore - MediaSession may not be fully typed in TS lib
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: "Chex Mix Timer",
          artist: "Timer",
          album: "Chex Mix",
        });
        // @ts-ignore
        navigator.mediaSession.playbackState = "playing";
      } catch {}
    }
    return true;
  } catch {
    // Fallback to WebAudio beep if possible
    startBeep(enabled);
    return false;
  }
}

function stopAlarmSound() {
  try {
    sharedAlarmAudio?.pause();
    if (sharedAlarmAudio) {
      sharedAlarmAudio.currentTime = 0;
    }
  } catch {
    // no-op
  }
  if ("mediaSession" in navigator) {
    try {
      // @ts-ignore
      navigator.mediaSession.playbackState = "none";
    } catch {}
  }
  stopBeep();
}

function notify(enabled: boolean, title: string, body?: string) {
  if (!enabled) return;
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "show-notification",
      title,
      body,
    });
  }
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Timer() {
  const { isStandalone, isIOS } = useDisplayMode();
  const [totalRounds] = useState(4);
  const [intervalMinutes] = useState(0.2);
  const [soundEnabled] = useLocalStorage<boolean>("cfg_sound", true);
  const [notifyEnabled, setNotifyEnabled] = useLocalStorage<boolean>(
    "cfg_notify",
    true,
  );
  const [notificationPermission, setNotificationPermission] = useState(
    "Notification" in window ? Notification.permission : "default",
  );

  const [currentRound, setCurrentRound] = useLocalStorage<number>(
    "state_currentRound",
    1,
  );
  const [running, setRunning] = useLocalStorage<boolean>(
    "state_running",
    false,
  );
  const [endTime, setEndTime] = useLocalStorage<number | null>(
    "state_endTime",
    null,
  );
  const [now, setNow] = useState(() => Date.now());
  const [celebrate, setCelebrate] = useState(false);
  const [timerEnded, setTimerEnded] = useLocalStorage<boolean>(
    "state_timerEnded",
    false,
  );
  const [alarmSilenced, setAlarmSilenced] = useLocalStorage<boolean>(
    "state_alarmSilenced",
    false,
  );
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const wakeLock = useRef<WakeLockSentinel | null>(null);

  const acquireWakeLock = async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLock.current = await (navigator.wakeLock as any).request("screen");
      } catch (err: any) {
        console.error(`Wake Lock request failed: ${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock.current) {
      try {
        await wakeLock.current.release();
        wakeLock.current = null;
      } catch (err: any) {
        console.error(`Wake Lock release failed: ${err.name}, ${err.message}`);
      }
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (wakeLock.current !== null) {
          acquireWakeLock();
        }
        if (timerEnded && !alarmSilenced) {
          // Try to restart audio when app returns to foreground
          startAlarmSound(soundEnabled).then((ok) => {
            if (ok) setIsAudioPlaying(true);
          });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, [timerEnded, alarmSilenced, soundEnabled]);

  const intervalMs = intervalMinutes * 60 * 1000;
  const remaining = endTime ? endTime - now : intervalMs;
  const percent = useMemo(() => {
    const elapsed = endTime
      ? Math.max(0, intervalMs - Math.max(0, remaining))
      : 0;
    const pct = Math.round((elapsed / intervalMs) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [remaining, endTime, intervalMs]);

  useInterval(() => setNow(Date.now()), running && !timerEnded ? 200 : null);

  useEffect(() => {
    if (!running || endTime === null) return;
    if (remaining <= 0) {
      notify(notifyEnabled, "Time to mix!", `Round ${currentRound} finished`);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1200);
      setRunning(false);
      setTimerEnded(true);
      setAlarmSilenced(false);
      releaseWakeLock();
    }
  }, [running, endTime, remaining, soundEnabled, notifyEnabled, currentRound]);

  useEffect(() => {
    if (timerEnded && !alarmSilenced && soundEnabled) {
      const playSound = async () => {
        const ok = await startAlarmSound(soundEnabled);
        setIsAudioPlaying(ok);
        if (ok) navigator.vibrate?.([200, 100, 200]);
      };
      playSound();
    } else {
      stopAlarmSound();
      setIsAudioPlaying(false);
    }
  }, [timerEnded, alarmSilenced, soundEnabled]);

  function silenceAlarm() {
    stopAlarmSound();
    setAlarmSilenced(true);
    setIsAudioPlaying(false);
  }

  function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
      setNotifyEnabled(permission === "granted");
    });
  }

  function startTimer() {
    if (running) return;
    setEndTime(Date.now() + intervalMs);
    setRunning(true);
    setTimerEnded(false);
    stopAlarmSound();
    acquireWakeLock();
    try {
      const el = ensureAlarmAudio();
      const prevMuted = el.muted;
      el.muted = true;
      el.play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.muted = prevMuted;
        })
        .catch(() => {
          el.muted = prevMuted;
        });
    } catch {}
  }

  function pauseTimer() {
    if (!running || endTime === null) return;
    const left = Math.max(0, endTime - Date.now());
    setEndTime(-left);
    setRunning(false);
    stopAlarmSound();
    releaseWakeLock();
  }

  function resumeTimer() {
    if (running || endTime === null) return;
    const snapshot = endTime < 0 ? -endTime : intervalMs;
    setEndTime(Date.now() + snapshot);
    setRunning(true);
    setTimerEnded(false);
    stopAlarmSound();
    acquireWakeLock();
    try {
      const el = ensureAlarmAudio();
      const prevMuted = el.muted;
      el.muted = true;
      el.play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.muted = prevMuted;
        })
        .catch(() => {
          el.muted = prevMuted;
        });
    } catch {}
  }

  function startNextRound() {
    stopAlarmSound();
    setTimerEnded(false);
    setAlarmSilenced(false);
    if (currentRound < totalRounds) {
      setCurrentRound(currentRound + 1);
      setEndTime(Date.now() + intervalMs);
      setRunning(true);
      acquireWakeLock();
    } else {
      setRunning(false);
      setEndTime(null);
      setCurrentRound(1);
      releaseWakeLock();
    }
  }

  function prevRound() {
    stopAlarmSound();
    setTimerEnded(false);
    setAlarmSilenced(false);
    setCurrentRound((r) => Math.max(1, r - 1));
    setEndTime(null);
    setRunning(false);
    releaseWakeLock();
  }

  function nextRound() {
    stopAlarmSound();
    setTimerEnded(false);
    setAlarmSilenced(false);
    setCurrentRound((r) => Math.min(totalRounds, r + 1));
    setEndTime(null);
    setRunning(false);
    releaseWakeLock();
  }

  const isPausedSnapshot = !running && (endTime ?? 0) < 0;
  const displayRemaining = timerEnded
    ? 0
    : isPausedSnapshot
      ? -Number(endTime)
      : running && endTime
        ? endTime - now
        : intervalMs;

  if (timerEnded) {
    if (!alarmSilenced) {
      return (
        <div className="section-card bg-white border-2 border-yellow-500 rounded-3xl shadow-xl p-6 md:p-10 w-full max-w-sm sm:max-w-md md:max-w-xl flex flex-col items-center justify-center">
          <h2 className="text-5xl font-bold text-green-800 mb-6">
            Round {currentRound} Over!
          </h2>
          {isAudioPlaying ? (
            <button
              className="btn btn-primary bg-green-500 border-2 border-green-600 hover:bg-green-600 text-white rounded-xl shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 btn-lg text-2xl"
              onClick={silenceAlarm}
            >
              Silence Alarm
            </button>
          ) : (
            <button
              className="btn btn-primary bg-yellow-500 border-2 border-yellow-600 hover:bg-yellow-600 text-white rounded-xl shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 btn-lg text-2xl"
              onClick={() => {
                startAlarmSound(soundEnabled).then((ok) => {
                  setIsAudioPlaying(ok);
                  if (ok) navigator.vibrate?.([200, 100, 200]);
                });
              }}
            >
              Play Alarm
            </button>
          )}
          {!isAudioPlaying && (
            <div className="mt-4 text-yellow-800 bg-yellow-50 border-2 border-yellow-500 rounded-xl p-3 text-center">
              If you don’t hear audio, tap “Play Alarm”, turn up the volume, and
              ensure Silent Mode is off.
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="section-card bg-white border-2 border-green-500 rounded-3xl shadow-xl p-8 md:p-12 flex flex-col items-center justify-center">
          <button
            className="btn btn-primary bg-green-500 border-2 border-green-600 hover:bg-green-600 text-white rounded-xl shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 btn-lg text-2xl"
            onClick={startNextRound}
          >
            {currentRound < totalRounds
              ? `Start Round ${currentRound + 1}`
              : "Restart Timer"}
          </button>
        </div>
      );
    }
  }

  return (
    <div className="section-card bg-white border-2 border-green-500 rounded-3xl shadow-xl p-4 md:p-12 w-full mx-auto">
      <div className="flex flex-col md:flex-row gap-4 md:gap-16 items-center">
        <div className="flex-1 grid place-items-center p-4 md:p-8">
          <motion.div
            className="relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
          >
            <div
              className="timer-progress"
              style={
                {
                  "--value": percent,
                } as React.CSSProperties
              }
              role="progressbar"
            >
              <div className="text-center">
                <div className="text-6xl md:text-7xl font-bold tabular-nums text-green-600">
                  {formatTime(displayRemaining)}
                </div>
              </div>
            </div>
            <motion.div
              className="absolute -inset-4 rounded-full pointer-events-none border-2 border-dashed border-green-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -inset-2 rounded-full pointer-events-none"
              initial={false}
              animate={
                celebrate
                  ? {
                      boxShadow:
                        "0 0 0 8px rgba(22,163,74,0.3), 0 0 60px 12px rgba(22,163,74,0.2)",
                    }
                  : { boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
              }
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        </div>

        <div className="flex-1 w-full flex flex-col">
          <div className="flex items-center justify-center mb-4 md:mb-6">
            <div className="bg-green-100 rounded-2xl p-3 md:p-4 border-2 border-green-500 text-center w-full">
              <div className="text-2xl md:text-3xl font-medium text-green-600 mb-1">
                Round
              </div>
              <div className="text-4xl md:text-3xl font-bold text-green-600">
                {currentRound} / {totalRounds}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-1 gap-3 w-full">
            <button
              className="btn btn-secondary btn-outline border-2 border-green-500 hover:bg-green-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-green-700 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-100 md:col-start-1"
              onClick={prevRound}
              disabled={currentRound <= 1 || running || timerEnded}
            >
              <StepBack className="inline" size={18} /> Prev
            </button>

            {!running && !isPausedSnapshot && !timerEnded && (
              <button
                className="btn btn-primary bg-green-500 border-2 border-green-600 hover:bg-green-600 text-white rounded-xl shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={startTimer}
              >
                <Play className="text-white" size={18} /> Start
              </button>
            )}

            {running && (
              <button
                className="btn bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg font-semibold"
                onClick={pauseTimer}
              >
                <Pause className="text-white" size={18} /> Pause
              </button>
            )}

            {!running && isPausedSnapshot && !timerEnded && (
              <button
                className="btn btn-primary bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={resumeTimer}
              >
                <Play className="text-white" size={18} /> Resume
              </button>
            )}

            {timerEnded && currentRound < totalRounds && (
              <button
                className="btn btn-primary bg-green-500 border-2 border-green-600 hover:bg-green-600 text-white rounded-xl shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={startNextRound}
              >
                Start Next Round
              </button>
            )}

            {timerEnded && currentRound >= totalRounds && (
              <button
                className="btn btn-primary bg-green-500 border-2 border-green-600 hover:bg-green-600 text-white rounded-xl shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={startNextRound} // This will reset the timer
              >
                Restart Timer
              </button>
            )}

            <button
              className="btn btn-secondary btn-outline border-2 border-green-500 hover:bg-green-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-green-700 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-100"
              onClick={nextRound}
              disabled={currentRound >= totalRounds || running || timerEnded}
            >
              <StepForward className="inline" size={18} /> Next
            </button>
          </div>
          {timerEnded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-yellow-100 border-2 border-yellow-500 rounded-xl text-center text-yellow-800 font-semibold text-lg"
            >
              Time to mix and put back in the oven!
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
