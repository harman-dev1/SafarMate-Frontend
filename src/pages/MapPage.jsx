import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { APIProvider } from '@vis.gl/react-google-maps';
import MapContainer from '@/components/MapContainer.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import RoutePanel from '@/components/RoutePanel.jsx';
import RouteDetailsPanel from '@/components/RouteDetailsPanel.jsx';
import NearbyPlacesPanel from '@/components/NearbyPlacesPanel.jsx';
import WeatherPanel from '@/components/WeatherPanel.jsx';
import MapControls from '@/components/MapControls.jsx';
import Navbar from '@/components/Navbar.jsx';
import NavigationOverlay from '@/components/NavigationOverlay.jsx';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useNavigation } from '@/hooks/useNavigation';
import { useMapStore } from '@/store/mapStore';
import toast from 'react-hot-toast';

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

export default function MapPage() {
  useGeolocation(true);
  useNavigation();

  const { openSidebar } = useOutletContext();
  const [bottomOpen] = useState(true);
  const { userLocation, isNavigating, weather, weatherLoading } = useMapStore();

  const handleSOS = () => {
    if (!userLocation) return toast.error('Waiting for location…');
    toast.success('🆘 SOS triggered — alerting nearby users');
  };

  if (!GOOGLE_KEY) {
    return (
      <div className="h-dvh grid place-items-center p-6">
        <div className="glass-strong rounded-2xl p-6 max-w-md text-center">
          <p className="font-semibold mb-2">⚠️ Google Maps key missing</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Add{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-xs">
              VITE_GOOGLE_MAPS_KEY
            </code>{' '}
            to <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-xs">frontend/.env</code> and restart.
          </p>
        </div>
      </div>
    );
  }

  const showWeatherAside = !isNavigating && (!!weather || weatherLoading);

  return (
    <APIProvider apiKey={GOOGLE_KEY} libraries={['places', 'marker']}>
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <MapContainer
            initialCenter={
              userLocation
                ? { lng: userLocation.lng, lat: userLocation.lat }
                : { lng: 74.3587, lat: 31.5204 }
            }
            initialZoom={13}
          />
        </div>

        {!isNavigating && <Navbar onOpenSidebar={openSidebar} />}

        {/* Search bar — narrower at lg, wider at xl, no overlap with sidebars */}
        {!isNavigating && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-sm xl:max-w-xl z-20 px-3 lg:px-0">
            <SearchBar />
          </div>
        )}

        {/* RIGHT sidebar — controls + alternatives + nearby */}
        {!isNavigating && (
          <aside className="hidden lg:flex flex-col gap-3 absolute top-20 right-4 bottom-24 w-80 xl:w-96 z-20 overflow-y-auto pr-1">
            <RoutePanel />
            <RouteDetailsPanel />
            <NearbyPlacesPanel />
          </aside>
        )}

        {/* LEFT sidebar — weather forecast (only when checked) */}
        <AnimatePresence>
          {showWeatherAside && (
            <motion.aside
  key="weather-aside"
  initial={{ opacity: 0, x: -24 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -24 }}
  transition={{ type: 'spring', stiffness: 280, damping: 30 }}
  className="hidden lg:flex flex-col gap-3 absolute top-20 left-4 bottom-6 w-80 xl:w-96 z-20 overflow-y-auto pl-1"
>
  <WeatherPanel />
</motion.aside>
          )}
        </AnimatePresence>

        {/* MOBILE bottom sheet */}
        <AnimatePresence>
          {bottomOpen && !isNavigating && (
            <motion.div
              key="bottom-sheet"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="lg:hidden absolute bottom-0 left-0 right-0 z-20 max-h-[70dvh] overflow-y-auto p-3 pt-2"
            >
              <div className="mx-auto h-1.5 w-12 bg-slate-300 dark:bg-white/15 rounded-full mb-2" />
              <div className="space-y-3">
                <RoutePanel />
                <WeatherPanel />
                <RouteDetailsPanel />
                <NearbyPlacesPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isNavigating && (
          <MapControls
            onToggleLayers={() => toast('Layers panel coming soon')}
            onSOS={handleSOS}
          />
        )}

        <NavigationOverlay />
      </div>
    </APIProvider>
  );
}