import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDarkMode } from '../contexts/DarkModeContext';
export function DarkModeToggle() {
  const {
    isDark,
    toggle
  } = useDarkMode();
  return <button onClick={toggle} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Toggle dark mode">
      <motion.div initial={false} animate={{
      rotate: isDark ? 180 : 0
    }} transition={{
      duration: 0.3
    }}>
        {isDark ? <Moon size={20} /> : <Sun size={20} />}
      </motion.div>
    </button>;
}