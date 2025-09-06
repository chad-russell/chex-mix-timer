import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, StepForward, StepBack } from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage";

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

function beep(enabled: boolean) {
  if (!enabled) return;
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    o.start();
    setTimeout(() => {
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 220);
    }, 220);
  } catch {
    // Silently ignore audio errors
  }
}

function notify(enabled: boolean, title: string, body?: string) {
  if (!enabled) return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((p) => {
      if (p === "granted") new Notification(title, { body });
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
  const [totalRounds] = useState(4);
  const [intervalMinutes] = useState(15);
  const [soundEnabled] = useLocalStorage<boolean>("cfg_sound", true);
  const [notifyEnabled] = useLocalStorage<boolean>("cfg_notify", true);

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

  const intervalMs = intervalMinutes * 60 * 1000;
  const remaining = endTime ? endTime - now : intervalMs;
  const percent = useMemo(() => {
    const elapsed = endTime
      ? Math.max(0, intervalMs - Math.max(0, remaining))
      : 0;
    const pct = Math.round((elapsed / intervalMs) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [remaining, endTime, intervalMs]);

  useInterval(() => setNow(Date.now()), running ? 200 : null);

  useEffect(() => {
    if (!running || endTime === null) return;
    if (remaining <= 0) {
      // Advance round
      beep(soundEnabled);
      try {
        navigator.vibrate?.(200);
      } catch {
        // Silently ignore audio errors
      }
      notify(notifyEnabled, "Time to mix!", `Round ${currentRound} finished`);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1200);
      if (currentRound >= totalRounds) {
        setRunning(false);
        setEndTime(null);
      } else {
        setCurrentRound(currentRound + 1);
        setEndTime(Date.now() + intervalMs);
      }
    }
  }, [remaining]);

  function start() {
    if (running) return;
    setEndTime(Date.now() + intervalMs);
    setRunning(true);
  }
  function pause() {
    if (!running || endTime === null) return;
    const left = Math.max(0, endTime - Date.now());
    // store remaining in endTime as negative to indicate paused snapshot
    setEndTime(-left);
    setRunning(false);
  }
  function resume() {
    if (running || endTime === null) return;
    const snapshot = endTime < 0 ? -endTime : intervalMs;
    setEndTime(Date.now() + snapshot);
    setRunning(true);
  }
  function prevRound() {
    setCurrentRound((r) => Math.max(1, r - 1));
    setEndTime(null);
    setRunning(false);
  }
  function nextRound() {
    setCurrentRound((r) => Math.min(totalRounds, r + 1));
    setEndTime(null);
    setRunning(false);
  }

  const isPausedSnapshot = !running && (endTime ?? 0) < 0;
  const displayRemaining = isPausedSnapshot
    ? -Number(endTime)
    : running && endTime
      ? endTime - now
      : intervalMs;

  return (
    <div className="section-card bg-white border-2 border-green-300 rounded-3xl shadow-xl p-8 md:p-12 min-w-[700px]">
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
        <div className="flex-1 grid place-items-center p-8">
          <motion.div
            className="relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
          >
            <div
              className="radial-progress text-green-600 shadow-2xl border-4 border-green-100 bg-green-50"
              style={
                {
                  "--value": percent as unknown as string,
                  "--size": "25rem",
                  "--thickness": "26px",
                } as React.CSSProperties
              }
              role="progressbar"
            >
              <div className="text-center">
                <div className="text-7xl font-bold tabular-nums text-green-600">
                  {formatTime(displayRemaining)}
                </div>
              </div>
            </div>
            <motion.div
              className="absolute -inset-4 rounded-full pointer-events-none border-2 border-dashed border-green-300"
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
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-100 rounded-2xl p-4 border-2 border-green-300 text-center w-full">
              <div className="text-3xl font-medium text-green-600 mb-1">
                Round
              </div>
              <div className="text-5xl font-bold text-green-600">
                {currentRound} / {totalRounds}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              className="btn btn-secondary btn-outline border-2 border-green-500 hover:bg-green-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-green-700 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-100"
              onClick={prevRound}
              disabled={currentRound <= 1}
            >
              <StepBack className="inline" size={18} /> Prev
            </button>
            {!running && !isPausedSnapshot && (
              <button
                className="btn btn-primary bg-green-500 border-2 border-green-600 hover:bg-green-600 text-white rounded-xl shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={start}
              >
                <Play className="text-white" size={18} /> Start
              </button>
            )}
            {running && (
              <button
                className="btn bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg font-semibold"
                onClick={pause}
              >
                <Pause className="text-white" size={18} /> Pause
              </button>
            )}
            {!running && isPausedSnapshot && (
              <button
                className="btn btn-primary bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={resume}
              >
                <Play className="text-white" size={18} /> Resume
              </button>
            )}
            <button
              className="btn btn-secondary btn-outline border-2 border-green-500 hover:bg-green-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-green-700 disabled:border-gray-300 disabled:text-gray-400 disabled:bg-gray-100"
              onClick={nextRound}
              disabled={currentRound >= totalRounds}
            >
              <StepForward className="inline" size={18} /> Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
