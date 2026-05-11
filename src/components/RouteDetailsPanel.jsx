import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, List, Route as RouteIcon } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';
import { fmtDist, fmtDuration } from '@/utils/geo';

export default function RouteDetailsPanel() {
  const { routes, activeRouteIdx, setActiveRoute, isNavigating } = useMapStore();
  const [showSteps, setShowSteps] = useState(false);

  if (isNavigating) return null;
  if (!routes?.length) return null;

  const activeRoute = routes[activeRouteIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-4 w-full"
    >
      <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
        <RouteIcon size={11} /> Alternatives
      </p>

      <div className="space-y-2">
        {routes.map((r, i) => (
          <button
            key={i}
            onClick={() => setActiveRoute(i)}
            className={`w-full text-left glass rounded-xl p-3 flex items-center justify-between transition ${
              i === activeRouteIdx ? 'ring-2 ring-brand-500' : 'hover:scale-[1.01]'
            }`}
          >
            <div>
              <p className="font-semibold">{fmtDuration(r.duration)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {fmtDist(r.distance)} • {r.steps?.length || 0} steps
              </p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                i === 0
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-500/15 text-slate-500'
              }`}
            >{i === 0 ? 'Best' : `Alt ${i}`}</span>
          </button>
        ))}
      </div>

      {activeRoute?.steps?.length > 0 && (
        <div className="glass rounded-xl mt-3">
          <button
            onClick={() => setShowSteps((s) => !s)}
            className="w-full px-3 py-2.5 flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2 font-medium">
              <List size={14} /> Turn-by-turn ({activeRoute.steps.length})
            </span>
            <ChevronDown size={16} className={`transition ${showSteps ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence initial={false}>
            {showSteps && (
              <motion.ol
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 max-h-72 overflow-y-auto space-y-1">
                  {activeRoute.steps.map((s, idx) => (
                    <li key={idx} className="flex gap-2 text-xs pt-1.5 pb-1.5 border-b border-slate-200/50 dark:border-white/5 last:border-0">
                      <span className="shrink-0 h-5 w-5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 grid place-items-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p dangerouslySetInnerHTML={{ __html: s.instruction }} />
                        {s.distance && (
                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {fmtDist(s.distance)}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </div>
              </motion.ol>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}