import { useEffect } from 'react';
import { useMapStore } from '@/store/mapStore';
import { useIncidentStore } from '@/store/incidentStore';
import { apiGetIncidentsInBbox } from '@/api/incident';

// Fetch incidents within a wide bbox around the user when they connect
// or move significantly. Re-fetches every 5 minutes as a safety net.
export const useIncidentBootstrap = () => {
  const { userLocation } = useMapStore();
  const { setIncidents } = useIncidentStore();

  useEffect(() => {
    if (!userLocation) return;
    const { lat, lng } = userLocation;
    const buf = 0.5; // ~55 km square around the user

    const fetchOnce = async () => {
      try {
        const { data } = await apiGetIncidentsInBbox({
          minLng: lng - buf, maxLng: lng + buf,
          minLat: lat - buf, maxLat: lat + buf,
        });
        setIncidents(data.data || []);
      } catch (err) {
        console.warn('Failed to bootstrap incidents:', err.message);
      }
    };

    fetchOnce();
    const interval = setInterval(fetchOnce, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // Re-run only when user moves by ~1 km (round to 2 decimal places of lat/lng)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userLocation && Math.round(userLocation.lat * 100) / 100,
    userLocation && Math.round(userLocation.lng * 100) / 100,
  ]);
};