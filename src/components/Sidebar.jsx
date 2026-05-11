import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Bookmark, User, Settings, LogOut, Compass, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { firebaseSignOut } from '@/services/firebase';

const items = [
  { to: '/app', icon: Map, label: 'Map' },
  { to: '/saved', icon: Bookmark, label: 'Saved Places' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await firebaseSignOut(); } catch {}
    clearAuth();
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
          <motion.aside
            initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 h-full w-72 z-50 glass-strong p-5 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center shadow-glow">
                  <Compass className="text-white" size={18} />
                </div>
                <span className="font-display font-bold text-lg">SafarMate</span>
              </div>
              <button onClick={onClose} className="btn-icon lg:hidden"><X size={18} /></button>
            </div>

            <div className="glass rounded-2xl p-3 mb-5 flex items-center gap-3">
              <img
                src={user?.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || 'U'}`}
                alt=""
                className="h-11 w-11 rounded-full ring-2 ring-brand-500/40"
              />
              <div className="min-w-0">
                <p className="font-semibold truncate">{user?.displayName || 'Guest'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <nav className="space-y-1 flex-1">
              {items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to} to={to} onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                        : 'hover:bg-slate-100 dark:hover:bg-white/5'
                    }`
                  }
                >
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut size={18} /> Logout
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}