import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader2, Crosshair } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { apiAutocomplete } from '@/api/search';
import { useMapStore } from '@/store/mapStore';

export default function LocationPickerInput({
  value,
  onChange,
  placeholder = 'Search a place',
  dotColor = 'bg-brand-500',
  showMyLocation = false,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const debounced = useDebounce(q, 250);
  const userLocation = useMapStore((s) => s.userLocation);

  const display = value?.name || '';

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!debounced || debounced.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const params = userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : {};
        const { data } = await apiAutocomplete(debounced, params);
        if (!cancelled) setResults(data.data || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debounced, userLocation]);

  useEffect(() => {
    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false);
        setQ('');
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const choose = (item) => {
    onChange(item);
    setOpen(false);
    setQ('');
  };

  const useMyLocation = () => {
    if (!userLocation) return;
    onChange({
      name: 'My Location',
      address: 'Current GPS position',
      lat: userLocation.lat,
      lng: userLocation.lng,
    });
    setOpen(false);
    setQ('');
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange(null);
    setQ('');
  };

  const openAndFocus = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div
        onClick={openAndFocus}
        className={`glass rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-text transition ${
          open ? 'ring-2 ring-brand-500/40' : ''
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${dotColor} shrink-0`} />
        <input
          ref={inputRef}
          value={open ? q : display}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={value ? '' : placeholder}
          className="input flex-1 text-sm bg-transparent"
        />
        {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
        {value && !open && (
          <button onClick={clear} className="text-slate-400 hover:text-rose-500">
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 glass-strong rounded-xl overflow-hidden z-50 max-h-64 overflow-y-auto shadow-xl"
          >
            {showMyLocation && userLocation && (
              <button
                onClick={useMyLocation}
                className="w-full flex items-center gap-3 p-2.5 hover:bg-brand-50 dark:hover:bg-white/5 text-left"
              >
                <div className="h-8 w-8 rounded-lg grid place-items-center bg-brand-500/15 text-brand-600 dark:text-brand-400">
                  <Crosshair size={14} />
                </div>
                <div>
                  <p className="font-medium text-sm">Use my location</p>
                  <p className="text-[11px] text-slate-500">Current GPS position</p>
                </div>
              </button>
            )}

            {q.length < 2 && results.length === 0 && !showMyLocation && (
              <div className="p-4 text-center text-xs text-slate-500">
                Type at least 2 characters…
              </div>
            )}

            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => choose(r)}
                className="w-full flex items-start gap-3 p-2.5 hover:bg-brand-50 dark:hover:bg-white/5 text-left"
              >
                <div className="h-8 w-8 rounded-lg grid place-items-center bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 shrink-0">
                  <MapPin size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{r.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {r.address}
                  </p>
                </div>
              </button>
            ))}

            {q.length >= 2 && !loading && results.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">No results</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}