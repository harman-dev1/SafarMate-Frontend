import { useOutletContext } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import Navbar from '@/components/Navbar.jsx';

export default function SavedPage() {
  const { openSidebar } = useOutletContext();
  return (
    <div className="h-full relative">
      <Navbar onOpenSidebar={openSidebar} />
      <div className="pt-24 px-6 max-w-3xl mx-auto">
        <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2"><Bookmark /> Saved Places</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Your favorite locations live here.</p>
        <div className="glass-strong rounded-2xl p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">No saved places yet — search and tap the bookmark icon to add one.</p>
        </div>
      </div>
    </div>
  );
}