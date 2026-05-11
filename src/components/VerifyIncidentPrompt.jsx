import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { useState } from 'react';
import { useIncidentStore } from '@/store/incidentStore';
import { useMapStore } from '@/store/mapStore';
import { apiVerifyIncident } from '@/api/incident';
import toast from 'react-hot-toast';

const TYPE_META = {
  pothole:      { emoji: '🕳️', label: 'Pothole' },
  roadblock:    { emoji: '🚧', label: 'Roadblock' },
  construction: { emoji: '🏗️', label: 'Construction' },
  flooding:     { emoji: '🌊', label: 'Flooding' },
  checkpoint:   { emoji: '👮', label: 'Checkpoint' },
  obstacle:     { emoji: '🐄', label: 'Obstacle' },
};

export default function VerifyIncidentPrompt() {
  const { verifyPrompt, dismissVerifyPrompt, updateIncident, removeIncident } = useIncidentStore();
  const { userLocation } = useMapStore();
  const [busy, setBusy] = useState(false);

  const inc = verifyPrompt?.incident;
  const meta = inc ? (TYPE_META[inc.type] || { emoji: '⚠️', label: inc.type }) : null;

  const handle = async (action) => {
    if (!userLocation || !inc) return;
    setBusy(true);
    try {
      const { data } = await apiVerifyIncident({
        id: inc._id,
        action,
        userLat: userLocation.lat,
        userLng: userLocation.lng,
      });
      if (data.data.status === 'active') updateIncident(data.data);
      else removeIncident(inc._id);
      toast.success(action === 'confirm' ? '👍 Thanks' : '👎 Marked cleared');
      dismissVerifyPrompt();
    } catch {
      // silent
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {inc && (
        /* Below the nav instruction card (which sits at top-4),
           and centered within the visible map area */
        <div className="absolute inset-x-0 top-24 z-30 flex justify-center px-4 pointer-events-none">
          <motion.div
            key={inc._id}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="w-full max-w-sm glass-strong rounded-2xl px-3 py-2 shadow-2xl flex items-center gap-2 pointer-events-auto"
          >
            <span className="text-xl">{meta.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{meta.label} here?</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Help others — quickly verify
              </p>
            </div>
            <button
              onClick={() => handle('confirm')}
              disabled={busy}
              className="h-9 w-9 grid place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 transition shrink-0"
              aria-label="Confirm"
            >
              <ThumbsUp size={14} />
            </button>
            <button
              onClick={() => handle('deny')}
              disabled={busy}
              className="h-9 w-9 grid place-items-center rounded-lg bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 transition shrink-0"
              aria-label="Deny"
            >
              <ThumbsDown size={14} />
            </button>
            <button
              onClick={dismissVerifyPrompt}
              className="h-9 w-9 grid place-items-center rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 transition shrink-0"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}