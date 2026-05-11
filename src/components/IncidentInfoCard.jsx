import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ThumbsUp, ThumbsDown, Trash2, Clock, User as UserIcon, Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useIncidentStore } from '@/store/incidentStore';
import { useMapStore } from '@/store/mapStore';
import { useAuthStore } from '@/store/authStore';
import { apiVerifyIncident, apiRemoveIncident } from '@/api/incident';
import toast from 'react-hot-toast';

const TYPE_META = {
  pothole:      { emoji: '🕳️', label: 'Pothole' },
  roadblock:    { emoji: '🚧', label: 'Roadblock' },
  construction: { emoji: '🏗️', label: 'Construction' },
  flooding:     { emoji: '🌊', label: 'Flooding' },
  checkpoint:   { emoji: '👮', label: 'Police checkpoint' },
  obstacle:     { emoji: '🐄', label: 'Obstacle on road' },
};

const severityColor = {
  low:    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  high:   'bg-rose-500/15 text-rose-700 dark:text-rose-400',
};

const fmtAgo = (t) => {
  const diff = Math.floor((Date.now() - new Date(t).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff} min ago`;
  return `${Math.floor(diff / 60)}h ago`;
};

export default function IncidentInfoCard() {
  const { selectedIncident, setSelectedIncident, updateIncident, removeIncident } = useIncidentStore();
  const { userLocation } = useMapStore();
  const { user } = useAuthStore();

  const [busy, setBusy] = useState(false);
  const inc = selectedIncident;

  const meta = inc ? (TYPE_META[inc.type] || { emoji: '⚠️', label: inc.type }) : null;
  const isMyReport = inc && (inc.reporter?._id === user?._id || inc.reporter === user?._id);

  const handleVerify = async (action) => {
    if (!userLocation || !inc) return toast.error('Waiting for location…');
    setBusy(true);
    try {
      const { data } = await apiVerifyIncident({
        id: inc._id,
        action,
        userLat: userLocation.lat,
        userLng: userLocation.lng,
      });
      if (data.data.status === 'active') {
        updateIncident(data.data);
        toast.success(action === 'confirm' ? '👍 Confirmed — thank you' : '👎 Reported as cleared');
      } else {
        removeIncident(inc._id);
        toast.success('Report removed (community consensus)');
      }
      setSelectedIncident(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to verify';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!inc) return;
    setBusy(true);
    try {
      await apiRemoveIncident(inc._id);
      removeIncident(inc._id);
      toast.success('Your report has been removed');
      setSelectedIncident(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {inc && (
        /* Flex wrapper centers within the map area:
           mobile = full width, lg+ = constrained to viewport minus right sidebar */
        <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center px-4 pointer-events-none lg:right-[21rem] xl:right-[25rem]">
          <motion.div
            key={inc._id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="w-full max-w-md glass-strong rounded-2xl p-4 shadow-2xl pointer-events-auto"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-500/15 grid place-items-center text-2xl shrink-0">
                {meta.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base">{meta.label}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${severityColor[inc.severity]}`}>
                    {inc.severity.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {fmtAgo(inc.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserIcon size={11} /> {inc.reporter?.displayName || 'Anonymous'}
                  </span>
                </div>
                {inc.note && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 italic">"{inc.note}"</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ThumbsUp size={11} /> {Math.round(inc.confirmations || 0)}
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                    <ThumbsDown size={11} /> {Math.round(inc.denials || 0)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="h-7 w-7 grid place-items-center rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 transition shrink-0"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              {isMyReport ? (
                <button
                  onClick={handleRemove}
                  disabled={busy}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Remove my report
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleVerify('confirm')}
                    disabled={busy}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <ThumbsUp size={12} /> Still here
                  </button>
                  <button
                    onClick={() => handleVerify('deny')}
                    disabled={busy}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <ThumbsDown size={12} /> Cleared
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}