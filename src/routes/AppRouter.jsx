import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

import LandingPage from '@/pages/LandingPage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import MapPage from '@/pages/MapPage.jsx';
import SavedPage from '@/pages/SavedPage.jsx';
import ProfilePage from '@/pages/ProfilePage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';
import NotFoundPage from '@/pages/NotFoundPage.jsx';
import MainLayout from '@/layouts/MainLayout.jsx';

const Protected = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  return user ? children : <Navigate to="/login" replace />;
};

export const AppRouter = () => (
  <AnimatePresence mode="wait">
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Protected><MainLayout /></Protected>}>
        <Route path="/app" element={<MapPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </AnimatePresence>
);