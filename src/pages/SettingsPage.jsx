import { useOutletContext } from 'react-router-dom';
import Navbar from '@/components/Navbar.jsx';
import ThemeToggle from '@/components/ThemeToggle.jsx';

export default function SettingsPage() {
  const { openSidebar } = useOutletContext();
  return (
    <div className="h-full relative">
      <Navbar onOpenSidebar={openSidebar} />
      <div className="pt-24 px-6 max-w-3xl mx-auto space-y-4">
        <h1 className="font-display text-3xl font-bold">Settings</h1>

        <div className="glass-strong rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold">Appearance</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Choose your preferred theme.</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <p className="font-semibold mb-1">Map Style</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Coming soon — Standard / Satellite / Dark.</p>
        </div>
      </div>
    </div>
  );
}