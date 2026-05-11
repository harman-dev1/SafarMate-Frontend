import { useOutletContext } from 'react-router-dom';
import Navbar from '@/components/Navbar.jsx';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const { openSidebar } = useOutletContext();
  const user = useAuthStore((s) => s.user);
  return (
    <div className="h-full relative">
      <Navbar onOpenSidebar={openSidebar} />
      <div className="pt-24 px-6 max-w-3xl mx-auto">
        <div className="glass-strong rounded-2xl p-6 flex items-center gap-5">
          <img src={user?.profilePicture} alt="" className="h-20 w-20 rounded-2xl ring-2 ring-brand-500/30" />
          <div>
            <h1 className="font-display text-2xl font-bold">{user?.displayName}</h1>
            <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 uppercase tracking-wider">{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}