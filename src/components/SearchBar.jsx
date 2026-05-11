import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Loader2, Clock } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { apiAutocomplete } from '@/api/search';
import { useMapStore } from '@/store/mapStore';

const RECENT_KEY = 'safarmate_recent_searches';
const getRecents = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } };
const pushRecent = (item) => {
  const cur = getRecents().filter((r) => r.id !== item.id);
  cur.unshift(item);
  localStorage.setItem(RECENT_KEY, JSON.stringify(cur.slice(0, 6)));
};

const Highlight = ({ text, query }) => {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-brand-600 dark:text-brand-400 font-semibold">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
};

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [recents, setRecents] = useState(getRecents());
  const wrapRef = useRef(null);
  const debounced = useDebounce(q, 280);

  const { userLocation, setSelectedPlace, setDestination } = useMapStore();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!debounced || debounced.length < 2) { setResults([]); return; }
      setLoading(true);
      try {
        const params = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : {};
        const { data } = await apiAutocomplete(debounced, params);
        if (!cancelled) { setResults(data.data || []); setHighlight(0); }
      } finally { if (!cancelled) setLoading(false); }
    };
    run();
    return () => { cancelled = true; };
  }, [debounced, userLocation]);

  useEffect(() => {
    const onClick = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const choose = (item) => {
    setSelectedPlace(item);
    setDestination(item);
    pushRecent(item);
    setRecents(getRecents());
    setQ(item.name);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) return;
    const list = q ? results : recents;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, list.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    if (e.key === 'Enter' && list[highlight]) choose(list[highlight]);
    if (e.key === 'Escape') setOpen(false);
  };

  const showList = open && (q ? results.length > 0 || loading : recents.length > 0);

  return (
    <div ref={wrapRef} className="w-full max-w-xl">
      <div className="glass-strong rounded-2xl flex items-center gap-2 px-4 py-3 transition focus-within:ring-2 focus-within:ring-brand-500/40">
        <Search size={18} className="text-slate-500 dark:text-slate-400 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search places, addresses, landmarks…"
          className="input flex-1 text-[15px]"
        />
        {loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
        {q && !loading && (
          <button onClick={() => { setQ(''); setResults([]); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="glass-strong rounded-2xl mt-2 overflow-hidden max-h-[60vh] overflow-y-auto"
          >
            {!q && recents.length > 0 && (
              <div className="p-2">
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Recent</p>
                {recents.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => choose(r)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition ${
                      highlight === i ? 'bg-brand-50 dark:bg-white/5' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <Clock size={16} className="mt-1 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {q && results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => choose(r)}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition ${
                  highlight === i ? 'bg-brand-50 dark:bg-white/5' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="h-9 w-9 rounded-xl grid place-items-center bg-brand-500/10 text-brand-600 dark:text-brand-400 shrink-0">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate"><Highlight text={r.name} query={q} /></p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.address}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0 mt-1">{r.source}</span>
              </button>
            ))}
            {q && !loading && results.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No results for “{q}”</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}