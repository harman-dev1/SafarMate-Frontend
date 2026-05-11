import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const opts = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    const Icon = opts.find((o) => o.value === theme)?.icon || Sun;
    return (
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="btn-icon"
        aria-label="Toggle theme"
      >
        <Icon size={18} />
      </button>
    );
  }

  return (
    <div className="glass rounded-full p-1 flex items-center gap-1">
      {opts.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`relative px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
            theme === value ? 'text-white' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {theme === value && (
            <motion.span
              layoutId="theme-pill"
              className="absolute inset-0 bg-brand-600 rounded-full"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Icon size={14} className="relative z-10" />
          <span className="relative z-10">{label}</span>
        </button>
      ))}
    </div>
  );
}