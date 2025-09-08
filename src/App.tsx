import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer as TimerIcon, BookOpenText, Settings as SettingsIcon } from "lucide-react";
import Timer from "./components/Timer";
import Recipe from "./components/Recipe";
import Settings from "./components/Settings";
import useLocalStorage from "./hooks/useLocalStorage";

type Tab = "timer" | "recipe" | "settings";

export default function App() {
  const [tab, setTab] = useLocalStorage<Tab>("ui_tab", "timer");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.body.setAttribute("data-theme", "christmas");
    setMounted(true);
  }, []);

  const handleDebugClear = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    try {
      navigator.vibrate?.(50);
    } catch {
      // ignore
    }
    // Reload to ensure all state resets to defaults
    window.location.reload();
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "timer",
      label: "Timer",
      icon: <TimerIcon size={18} className="text-current" />,
    },
    {
      key: "recipe",
      label: "Recipe",
      icon: <BookOpenText size={18} className="text-current" />,
    },
    {
      key: "settings",
      label: "Settings",
      icon: <SettingsIcon size={18} className="text-current" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stripes-red relative overflow-hidden">
      {/* Snowfall effect */}
      <div className="snowfall"></div>
      <div className="snowfall"></div>
      <div className="snowfall"></div>
      <div className="snowfall"></div>

      <header className="sticky p-4 z-10">
        <div className="navbar bg-white rounded-xl shadow-lg border-2 border-green-600">
          <div className="flex-1 items-center gap-2">
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl font-bold inline-flex items-center gap-2"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="text-primary"
              >
                🎄
              </motion.div>
              <span className="text-green-600">Chex Mix Timer</span>
            </motion.span>
          </div>
          <nav className="flex-none">
            <div className="tabs tabs-boxed bg-white rounded-full p-1 shadow-inner border border-green-300">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`tab flex items-center gap-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 ${tab === t.key
                    ? "tab-active bg-green-500 text-white font-semibold"
                    : ""
                    }`}
                  style={
                    tab !== t.key
                      ? { color: "black", opacity: 1 }
                      : {}
                  }
                  onClick={() => setTab(t.key)}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t.icon}
                  </motion.div>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10 flex-1 w-full flex justify-center items-center">
        <AnimatePresence mode="wait">
          {mounted && (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {tab === "timer" && <Timer />}
              {tab === "recipe" && <Recipe />}
              {tab === "settings" && <Settings />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-4 text-center">
        <motion.div
          className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-md border-2 border-green-600 cursor-pointer select-none"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          onClick={handleDebugClear}
          role="button"
          tabIndex={0}
          title="Tap to clear local data"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDebugClear();
            }
          }}
        >
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-lg"
          >
            ❄️
          </motion.span>
          <span className="text-sm font-medium text-green-600">
            Happy Snacking!
          </span>
          <motion.span
            animate={{ rotate: [0, -15, 15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-lg"
          >
            ❄️
          </motion.span>
        </motion.div>
      </footer>
    </div>
  );
}
