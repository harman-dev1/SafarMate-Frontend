import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Activity, CloudRain, AlertTriangle, Flame, X, ShieldAlert,
} from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import { SafetyLegend } from '@/components/SafetyScoreLayer';

const Toggle = ({ enabled, onToggle, disabled }) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
      disabled ? 'opacity-40 cursor-not-allowed' : ''
    } ${
      enabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-white/15'
    }`}
    aria-label={enabled ? 'Disable layer' : 'Enable layer'}
  >
    <motion.span
      animate={{ x: enabled ? 20 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
    />
  </button>
);

const LayerRow = ({
  icon: Icon, name, description, color,
  enabled, onToggle, comingSoon,
}) => (
  <div
    className={`flex items-center gap-3 p-2.5 rounded-xl transition ${
      enabled
        ? 'bg-white/40 dark:bg-white/5'
        : 'hover:bg-white/20 dark:hover:bg-white/5'
    } ${comingSoon ? 'opacity-60' : ''}`}
  >
    <div
      className="h-9 w-9 rounded-lg grid place-items-center shrink-0"
      style={{ background: `${color}25` }}
    >
      <Icon size={18} style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold leading-tight truncate">{name}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
        {comingSoon ? 'Coming soon' : description}
      </p>
    </div>
    <Toggle enabled={enabled} onToggle={onToggle} disabled={comingSoon} />
  </div>
);

export default function LayersPanel({ open, onClose }) {
  const { layers, toggleLayer } = useMapStore();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const activeCount = Object.values(layers).filter(Boolean).length;

  const layerDefs = [
    {
      key: 'traffic',
      icon: Activity,
      name: 'Route Traffic',
      description: 'Color your route by live congestion',
      color: '#ef4444',
    },
    {
      key: 'weather',
      icon: CloudRain,
      name: 'Weather',
      description: 'Forecast markers along route',
      color: '#0ea5e9',
    },
    {
      key: 'incidents',
      icon: AlertTriangle,
      name: 'Incidents',
      description: 'Community-reported hazards',
      color: '#f59e0b',
    },
    {
key: 'safety',
icon: ShieldAlert,
name: 'Safety Score',
description: 'ML-rated road segments along your route',
color: '#16a34a',
},
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="absolute bottom-28 right-4 w-72 glass-strong rounded-2xl p-3 z-30 shadow-2xl"
        >
          <div className="flex items-center gap-2 px-1 pb-2 mb-2 border-b border-slate-200/30 dark:border-white/5">
            <Layers size={16} className="text-brand-500" />
            <p className="text-sm font-bold flex-1">Map Layers</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold">
              {activeCount} active
            </span>
            <button
              onClick={onClose}
              className="h-7 w-7 grid place-items-center rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 transition"
              aria-label="Close layers panel"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1.5">
            {layerDefs.map((def) => (
              <LayerRow
                key={def.key}
                icon={def.icon}
                name={def.name}
                description={def.description}
                color={def.color}
                enabled={!!layers[def.key]}
                onToggle={() => toggleLayer(def.key)}
                comingSoon={def.comingSoon}
              />
            ))}
          </div>

          {/* Legend for route traffic — appears when toggle is on */}
          <AnimatePresence>
            {layers.traffic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 pt-2 border-t border-slate-200/30 dark:border-white/5 overflow-hidden"
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 px-1">
                  Traffic on your route
                </p>
                <div className="flex flex-wrap items-center gap-3 px-1">
                  {[
                    { c: '#10b981', l: 'Smooth' },
                    { c: '#f59e0b', l: 'Slow' },
                    { c: '#ef4444', l: 'Heavy' },
                  ].map(({ c, l }) => (
                    <span key={l} className="flex items-center gap-1.5 text-[10px]">
                      <span className="h-1 w-4 rounded-full" style={{ background: c }} />
                      <span className="text-slate-600 dark:text-slate-300">{l}</span>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Legend for safety score — appears when toggle is on */}
<AnimatePresence>
{layers.safety && (
<motion.div
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
exit={{ opacity: 0, height: 0 }}
className="mt-2 pt-2 border-t border-slate-200/30 dark:border-white/5 overflow-hidden"
>
<p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5
,→ px-1">
Safety score on your route
</p>
<SafetyLegend />
</motion.div>
)}
</AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}