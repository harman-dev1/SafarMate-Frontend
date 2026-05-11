import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, X, Loader2, Megaphone, MapPin,
} from 'lucide-react';
import { useIncidentStore } from '@/store/incidentStore';
import { useMapStore } from '@/store/mapStore';
import { apiReportIncident } from '@/api/incident';
import toast from 'react-hot-toast';

const TYPES = [
  { key: 'pothole',      label: 'Pothole',      emoji: '🕳️' },
  { key: 'roadblock',    label: 'Roadblock',    emoji: '🚧' },
  { key: 'construction', label: 'Construction', emoji: '🏗️' },
  { key: 'flooding',     label: 'Flooding',     emoji: '🌊' },
  { key: 'checkpoint',   label: 'Checkpoint',   emoji: '👮' },
  { key: 'obstacle',     label: 'Obstacle',     emoji: '🐄' },
];

const SEVERITIES = [
  { key: 'low',    label: 'Low',    color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40' },
  { key: 'medium', label: 'Medium', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40' },
  { key: 'high',   label: 'High',   color: 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40' },
];

export default function ReportIncidentModal() {
  const { reportModalOpen, closeReportModal } = useIncidentStore();
  const { userLocation } = useMapStore();

  const [type, setType] = useState('pothole');
  const [severity, setSeverity] = useState('medium');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form on close
  useEffect(() => {
    if (!reportModalOpen) {
      setType('pothole');
      setSeverity('medium');
      setNote('');
    }
  }, [reportModalOpen]);

  // ESC closes
  useEffect(() => {
    if (!reportModalOpen) return;
    const onKey = (e) => e.key === 'Escape' && closeReportModal();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [reportModalOpen, closeReportModal]);

  const handleSubmit = async () => {
    if (!userLocation) {
      toast.error('Your location is required to report');
      return;
    }
    setSubmitting(true);
    const loading = toast.loading('Submitting your report…');
    try {
      await apiReportIncident({
        type,
        severity,
        note,
        lat: userLocation.lat,
        lng: userLocation.lng,
        userLat: userLocation.lat,
        userLng: userLocation.lng,
      });
      toast.dismiss(loading);
      toast.success('Report submitted, thank you for helping the community', { icon: '✅' });
      closeReportModal();
    } catch (err) {
      toast.dismiss(loading);
      const msg = err.response?.data?.message || 'Failed to submit report';
      toast.error(msg, { duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {reportModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeReportModal}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Flex wrapper — handles centering immune to Framer transforms */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-md max-h-[90dvh] overflow-y-auto glass-strong rounded-2xl p-4 sm:p-5 shadow-2xl pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 grid place-items-center text-white shadow-lg shrink-0">
                  <Megaphone size={18} />
                </div>
                <h2 className="text-lg font-bold flex-1">Report an incident</h2>
                <button
                  onClick={closeReportModal}
                  className="h-8 w-8 grid place-items-center rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 transition shrink-0"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Location indicator */}
              <div className="mb-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 rounded-lg px-3 py-2">
                <MapPin size={13} className="text-emerald-500 shrink-0" />
                <span className="truncate">
                  {userLocation
                    ? `Your current location · ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                    : 'Waiting for location…'}
                </span>
              </div>

              {/* Type selector */}
              <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                What's the issue?
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {TYPES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    className={`p-2 rounded-xl border transition flex flex-col items-center gap-1 ${
                      type === t.key
                        ? 'bg-brand-500/15 border-brand-500 text-brand-700 dark:text-brand-300'
                        : 'border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xl">{t.emoji}</span>
                    <span className="text-[10px] font-medium leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Severity */}
              <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Severity
              </p>
              <div className="flex gap-2 mb-3">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSeverity(s.key)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold transition ${
                      severity === s.key
                        ? s.color
                        : 'border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Note */}
              <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Note (optional)
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                placeholder="E.g. Big pothole near the bridge — drive carefully"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm resize-none outline-none focus:ring-2 focus:ring-brand-500 transition"
                rows={2}
              />
              <p className="text-[10px] text-slate-400 text-right mt-1">{note.length}/200</p>

              {/* Anti-abuse note */}
              <div className="mt-2 mb-3 flex items-start gap-2 text-[10px] leading-tight text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2">
                <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
                <span>Reports must be honest — false reports lower your community trust score. Verify only what you actually see.</span>
              </div>

              {/* Submit */}
              <div className="flex gap-2">
                <button
                  onClick={closeReportModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !userLocation}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Submit Report
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}