import useLocalStorage from '../hooks/useLocalStorage'
import { Palette, BellRing, Volume2, Timer as TimerIcon } from 'lucide-react'

export default function Settings() {
  const [totalRounds, setTotalRounds] = useLocalStorage<number>('cfg_totalRounds', 8)
  const [intervalMinutes, setIntervalMinutes] = useLocalStorage<number>('cfg_intervalMinutes', 15)
  const [theme, setTheme] = useLocalStorage<string>('ui_theme', 'chexflat')
  const [sound, setSound] = useLocalStorage<boolean>('cfg_sound', true)
  const [notify, setNotify] = useLocalStorage<boolean>('cfg_notify', true)

  const themes = [
    { id: 'chexflat', label: 'Chex Flat' },
    { id: 'winter', label: 'Winter' },
    { id: 'cupcake', label: 'Cupcake' },
  ]

  return (
    <div className="section-card space-y-6">
      <div className="flex items-center gap-2">
        <TimerIcon className="text-primary" />
        <h2 className="text-2xl font-semibold">Settings</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="form-control">
          <label className="label"><span className="label-text">Total Rounds</span></label>
          <input type="number" min={1} className="input input-bordered" value={totalRounds}
                 onChange={(e) => setTotalRounds(Math.max(1, Number(e.target.value)))} />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Minutes Per Round</span></label>
          <input type="number" min={1} className="input input-bordered" value={intervalMinutes}
                 onChange={(e) => setIntervalMinutes(Math.max(1, Number(e.target.value)))} />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text inline-flex items-center gap-2"><Volume2 /> Sound</span></label>
          <input type="checkbox" className="toggle" checked={sound} onChange={(e) => setSound(e.target.checked)} />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text inline-flex items-center gap-2"><BellRing /> Desktop Notifications</span></label>
          <input type="checkbox" className="toggle" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        </div>

        <div className="form-control md:col-span-2">
          <label className="label"><span className="label-text inline-flex items-center gap-2"><Palette /> Theme</span></label>
          <div className="join">
            {themes.map(t => (
              <button key={t.id} className={`btn join-item ${theme === t.id ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setTheme(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs opacity-70 mt-2">Theme saves to your device and applies instantly.</p>
        </div>
      </div>
    </div>
  )}
