import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, StepForward, StepBack, Bell, ChefHat } from 'lucide-react'
import useLocalStorage from '../hooks/useLocalStorage'

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)
  useEffect(() => { savedCallback.current = callback }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

function beep(enabled: boolean) {
  if (!enabled) return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    o.connect(g)
    g.connect(ctx.destination)
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.01)
    o.start()
    setTimeout(() => {
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
      setTimeout(() => { o.stop(); ctx.close() }, 220)
    }, 220)
  } catch {}
}

function notify(enabled: boolean, title: string, body?: string) {
  if (!enabled) return
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    new Notification(title, { body })
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') new Notification(title, { body })
    })
  }
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60).toString().padStart(2, '0')
  const s = (total % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function Timer() {
  const [totalRounds] = useLocalStorage<number>('cfg_totalRounds', 8)
  const [intervalMinutes] = useLocalStorage<number>('cfg_intervalMinutes', 15)
  const [soundEnabled] = useLocalStorage<boolean>('cfg_sound', true)
  const [notifyEnabled] = useLocalStorage<boolean>('cfg_notify', true)

  const [currentRound, setCurrentRound] = useLocalStorage<number>('state_currentRound', 1)
  const [running, setRunning] = useLocalStorage<boolean>('state_running', false)
  const [endTime, setEndTime] = useLocalStorage<number | null>('state_endTime', null)
  const [now, setNow] = useState(() => Date.now())
  const [celebrate, setCelebrate] = useState(false)

  const intervalMs = intervalMinutes * 60 * 1000
  const remaining = endTime ? endTime - now : intervalMs
  const percent = useMemo(() => {
    const elapsed = endTime ? Math.max(0, intervalMs - Math.max(0, remaining)) : 0
    const pct = Math.round((elapsed / intervalMs) * 100)
    return Math.min(100, Math.max(0, pct))
  }, [remaining, endTime, intervalMs])

  useInterval(() => setNow(Date.now()), running ? 200 : null)

  useEffect(() => {
    if (!running || endTime === null) return
    if (remaining <= 0) {
      // Advance round
      beep(soundEnabled)
      try { navigator.vibrate?.(200) } catch {}
      notify(notifyEnabled, 'Time to mix!', `Round ${currentRound} finished`) 
      setCelebrate(true)
      setTimeout(() => setCelebrate(false), 1200)
      if (currentRound >= totalRounds) {
        setRunning(false)
        setEndTime(null)
      } else {
        setCurrentRound(currentRound + 1)
        setEndTime(Date.now() + intervalMs)
      }
    }
  }, [remaining])

  function start() {
    if (running) return
    setEndTime(Date.now() + intervalMs)
    setRunning(true)
  }
  function pause() {
    if (!running || endTime === null) return
    const left = Math.max(0, endTime - Date.now())
    // store remaining in endTime as negative to indicate paused snapshot
    setEndTime(-left)
    setRunning(false)
  }
  function resume() {
    if (running || endTime === null) return
    const snapshot = endTime < 0 ? -endTime : intervalMs
    setEndTime(Date.now() + snapshot)
    setRunning(true)
  }
  function resetRound() {
    setEndTime(null)
    setRunning(false)
  }
  function prevRound() {
    setCurrentRound(r => Math.max(1, r - 1))
    setEndTime(null)
    setRunning(false)
  }
  function nextRound() {
    setCurrentRound(r => Math.min(totalRounds, r + 1))
    setEndTime(null)
    setRunning(false)
  }

  const isPausedSnapshot = !running && (endTime ?? 0) < 0
  const displayRemaining = isPausedSnapshot ? -Number(endTime) : (running && endTime ? endTime - now : intervalMs)

  return (
    <div className="section-card">
      <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">
        <div className="flex-1 grid place-items-center">
          <motion.div
            className="relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 12 }}
          >
            <div className="radial-progress text-primary shadow-2xl"
                 style={{ ['--value' as any]: percent, ['--size' as any]: '14rem', ['--thickness' as any]: '14px' }}
                 role="progressbar">
              <div className="text-center">
                <div className="text-4xl font-semibold tabular-nums">{formatTime(displayRemaining)}</div>
                <div className="text-xs opacity-80">mm:ss</div>
              </div>
            </div>
            <motion.div
              className="absolute -inset-2 rounded-full pointer-events-none"
              initial={false}
              animate={celebrate ? { boxShadow: '0 0 0 4px rgba(255,255,255,0.2), 0 0 40px 8px rgba(239,68,68,0.35)' } : { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        </div>

        <div className="flex-1 w-full">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80">Round</div>
              <div className="text-2xl font-semibold">{currentRound} / {totalRounds}</div>
            </div>
            <div className="badge badge-accent badge-lg">
              Every {intervalMinutes} min
            </div>
          </div>

          <div className="divider"></div>

          <div className="grid grid-cols-3 gap-3">
            <button className="btn btn-secondary btn-outline" onClick={prevRound} disabled={currentRound <= 1}>
              <StepBack size={18} /> Prev
            </button>
            {!running && !isPausedSnapshot && (
              <button className="btn btn-primary" onClick={start}>
                <Play size={18} /> Start
              </button>
            )}
            {running && (
              <button className="btn btn-warning" onClick={pause}>
                <Pause size={18} /> Pause
              </button>
            )}
            {!running && isPausedSnapshot && (
              <button className="btn btn-primary" onClick={resume}>
                <Play size={18} /> Resume
              </button>
            )}
            <button className="btn btn-secondary btn-outline" onClick={nextRound} disabled={currentRound >= totalRounds}>
              <StepForward size={18} /> Next
            </button>
            <button className="btn btn-ghost" onClick={resetRound}>
              <RotateCcw size={18} /> Reset
            </button>
          </div>

          <div className="alert mt-4">
            <Bell />
            <div>
              <h3 className="font-bold">Reminder</h3>
              <div className="text-sm">When the timer hits 00:00, take the tray out and mix thoroughly, then place it back in and start the next round.</div>
            </div>
          </div>

          <div className="mt-4 opacity-80 text-sm inline-flex items-center gap-2">
            <ChefHat className="text-accent" />
            Tip: Stir gently to avoid breaking the pieces.
          </div>
        </div>
      </div>
    </div>
  )
}

