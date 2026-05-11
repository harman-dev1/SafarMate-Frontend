import { Menu, Compass } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import { useAuthStore } from '@/store/authStore';

export default function Navbar({ onOpenSidebar }) {
  const user = useAuthStore((s) => s.user);
  return (
    <header className="absolute top-0 left-0 right-0 z-30 p-3 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
        <button onClick={onOpenSidebar} className="btn-icon"><Menu size={18} /></button>
        <div className="hidden sm:flex items-center gap-2 glass rounded-full pl-2 pr-3 py-1.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center">
            <Compass className="text-white" size={14} />
          </div>
          <span className="font-display font-semibold">SafarMate</span>
        </div>
      </div>
      <div className="flex items-center gap-2 pointer-events-auto">
        <ThemeToggle compact />
        {user && (
          <img
            src={user.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`}
            alt="" className="h-9 w-9 rounded-full ring-2 ring-white/40 dark:ring-white/10"
          />
        )}
      </div>
    </header>
  );
}