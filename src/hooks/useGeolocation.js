import { useEffect, useState } from 'react';
import { useMapStore } from '@/store/mapStore';

export const useGeolocation = (watch = false) => {
  const setUserLocation = useMapStore((s) => s.setUserLocation);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    const opts = { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 };
    const onSuccess = ({ coords }) =>
      setUserLocation({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy });
    const onError = (e) => setError(e.message);

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, opts);
      return () => navigator.geolocation.clearWatch(id);
    }
    navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);
  }, [watch, setUserLocation]);

  return { error };
};