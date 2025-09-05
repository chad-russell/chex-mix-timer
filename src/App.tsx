import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer as TimerIcon, BookOpenText, Settings as SettingsIcon, Snowflake, TreePine } from 'lucide-react'
import Timer from './components/Timer'
import Recipe from './components/Recipe'
import Settings from './components/Settings'
import useLocalStorage from './hooks/useLocalStorage'

type Tab = 'timer' | 'recipe' | 'settings'

export default function App() {
  const [tab, setTab] = useLocalStorage<Tab>('ui_tab', 'timer')
  const [theme, setTheme] = useLocalStorage<string>('ui_theme', 'chexflat')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Migrate from old default theme to new flat theme
    if (theme === 'chexmas') setTheme('chexflat')
    document.body.setAttribute('data-theme', theme === 'chexmas' ? 'chexflat' : theme)
    setMounted(true)
  }, [theme, setTheme])

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'timer', label: 'Timer', icon: <TimerIcon size={18} /> },
    { key: 'recipe', label: 'Recipe', icon: <BookOpenText size={18} /> },
    { key: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10">
        <div className="navbar glass rounded-b-xl">
          <div className="flex-1 items-center gap-2">
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xl font-bold inline-flex items-center gap-2"
            >
              <TreePine className="text-primary animate-[pulse_2s_ease-in-out_infinite]" />
              Chex Mix Timer
            </motion.span>
          </div>
          <nav className="flex-none">
            <div className="tabs tabs-boxed">
              {tabs.map(t => (
                <button
                  key={t.key}
                  className={`tab flex items-center gap-2 ${tab === t.key ? 'tab-active' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10 flex-1 w-full max-w-5xl">
        <AnimatePresence mode="wait">
          {mounted && (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {tab === 'timer' && <Timer />}
              {tab === 'recipe' && <Recipe />}
              {tab === 'settings' && <Settings />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-4 text-center opacity-80">
        <div className="inline-flex items-center gap-2">
          <Snowflake className="animate-twinkle" />
          <span className="text-sm">Happy Holidays and happy snacking!</span>
        </div>
      </footer>
    </div>
  )
}
