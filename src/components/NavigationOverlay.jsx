import { motion, AnimatePresence } from 'framer-motion';
import {
  CornerUpLeft, CornerUpRight, ArrowUp, RotateCcw, X, Volume2, VolumeX,
  AlertTriangle, Flag,
} from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import { fmtDist, fmtDuration } from '@/utils/geo';
import { cleanInstruction } from '@/utils/voice';

const pickArrowIcon = (instruction = '') => {
  const t = instruction.toLowerCase();
  if (t.includes('left')) return CornerUpLeft;
  if (t.includes('right')) return CornerUpRight;
  if (t.includes('u-turn') || t.includes('uturn')) return RotateCcw;
  return ArrowUp;
};

export default function NavigationOverlay() {
  const {
    isNavigating, voiceMuted, toggleVoiceMute, stopNavigation,
    routes, activeRouteIdx, currentStepIdx, distanceToStep,
    remainingDistance, remainingDuration, offRoute, hasArrived,
  } = useMapStore();

  if (!isNavigating) return null;

  const route = routes[activeRouteIdx];
  const steps = route?.steps || [];
  const nextStep = steps[Math.min(currentStepIdx + 1, steps.length - 1)] || steps[0];
  const ArrowIcon = pickArrowIcon(nextStep?.instruction);

  const arrivalTime = new Date(Date.now() + remainingDuration * 1000).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <AnimatePresence>
      <motion.div
        key="nav-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 z-30 pointer-events-none"
      >
        {/* TOP INSTRUCTION CARD */}
        <motion.div
          initial={{ y: -120 }} animate={{ y: 0 }} exit={{ y: -120 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="absolute top-3 left-3 right-3 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-2xl pointer-events-auto"
        >
          <div className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <div className="h-14 w-14 rounded-xl bg-brand-600 text-white grid place-items-center shrink-0 shadow-glow">
              <ArrowIcon size={28} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold leading-tight">
                {distanceToStep > 0 ? fmtDist(distanceToStep) : 'Now'}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
                {cleanInstruction(nextStep?.instruction) || 'Continue ahead'}
              </p>
            </div>
            <button
              onClick={toggleVoiceMute}
              className="btn-icon shrink-0"
              title={voiceMuted ? 'Unmute' : 'Mute'}
            >
              {voiceMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          {/* Off-route banner */}
          {offRoute && !hasArrived && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-2 glass-strong rounded-xl px-3 py-2 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm"
            >
              <AlertTriangle size={14} />
              You're off the route — recalculating…
            </motion.div>
          )}

          {/* Arrival banner */}
          {hasArrived && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="mt-2 glass-strong rounded-xl px-3 py-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold"
            >
              <Flag size={18} /> You have arrived!
            </motion.div>
          )}
        </motion.div>

        {/* BOTTOM ETA BAR */}
        <motion.div
          initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="absolute bottom-3 left-3 right-3 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-2xl pointer-events-auto"
        >
          <div className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-4 shadow-2xl">
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold leading-tight">
                {fmtDuration(remainingDuration)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {fmtDist(remainingDistance)} • Arrive {arrivalTime}
              </p>
            </div>
            <button
              onClick={stopNavigation}
              className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold flex items-center gap-2 shadow-lg shadow-rose-500/30 active:scale-[.98] transition"
            >
              <X size={16} /> End
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}