import { useState } from 'react';
import {
  HeartPulse, Fuel, Utensils, Shield, Car, Zap, Pill, Banknote, Loader2, X,
} from 'lucide-react';
import { apiGetNearby } from '@/api/nearby';
import { useMapStore } from '@/store/mapStore';
import toast from 'react-hot-toast';

const cats = [
  { key: 'hospital',    icon: HeartPulse, label: 'Hospitals' },
  { key: 'fuel',        icon: Fuel,       label: 'Fuel' },
  { key: 'restaurant',  icon: Utensils,   label: 'Food' },
  { key: 'police',      icon: Shield,     label: 'Police' },
  { key: 'parking',     icon: Car,        label: 'Parking' },
  { key: 'ev_charging', icon: Zap,        label: 'EV' },
  { key: 'pharmacy',    icon: Pill,       label: 'Pharmacy' },
  { key: 'atm',         icon: Banknote,   label: 'ATM' },
];

export default function NearbyPlacesPanel() {
  const {
    userLocation, setNearby, nearbyCategory, nearbyPlaces, clearNearby,
  } = useMapStore();
  const [loading, setLoading] = useState(null);

  const fetchCat = async (key) => {
    if (!userLocation)
      return toast.error('Waiting for your location… (allow GPS)');
    setLoading(key);
    const tid = toast.loading(`Searching ${key.replace('_', ' ')} near you…`);
    try {
      const { data } = await apiGetNearby({
        lat: userLocation.lat,
        lng: userLocation.lng,
        category: key,
        radius: 5000,
      });
      const places = data.data || [];
      setNearby(key, places);
      toast.dismiss(tid);
      if (places.length === 0)
        toast(`No ${key.replace('_', ' ')} found within 5 km`, { icon: 'ℹ️' });
      else
        toast.success(`Found ${places.length} ${key.replace('_', ' ')}`);
    } catch (err) {
      toast.dismiss(tid);
      console.error('Nearby error:', err);
      const msg =
        err.response?.data?.message ||
        `Could not fetch ${key.replace('_', ' ')}`;
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="glass-strong rounded-2xl p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Nearby
        </p>
        {nearbyPlaces.length > 0 && (
          <button
            onClick={clearNearby}
            className="text-[11px] text-rose-500 hover:underline flex items-center gap-1"
          >
            <X size={11} /> Clear ({nearbyPlaces.length})
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cats.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => fetchCat(key)}
            disabled={loading !== null}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition disabled:opacity-50 ${
              nearbyCategory === key
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            {loading === key ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Icon size={18} />
            )}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}