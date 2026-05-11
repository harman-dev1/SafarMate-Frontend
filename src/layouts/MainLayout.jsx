import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar.jsx';

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="h-dvh w-full overflow-hidden">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <Outlet context={{ openSidebar: () => setOpen(true) }} />
    </div>
  );
}