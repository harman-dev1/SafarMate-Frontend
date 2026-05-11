import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain, AlertTriangle, Sparkles, ChevronDown, MapPin, Droplets, Clock,
  Thermometer, Umbrella,
} from 'lucide-react';
import { useState } from 'react';
import { useMapStore } from '@/store/mapStore';
import { conditionIcon } from '@/utils/weatherIcons';

const riskMeta = {
  clear:    { label: 'Clear skies ahead',    color: 'emerald', emoji: '☀️', gradient: 'from-emerald-400 to-emerald-600' },
  mild:     { label: 'Mostly fine',          color: 'sky',     emoji: '🌤️', gradient: 'from-sky-400 to-sky-600' },
  moderate: { label: 'Watch out',            color: 'amber',   emoji: '🌧️', gradient: 'from-amber-400 to-amber-600' },
  severe:   { label: 'Hazardous weather',    color: 'rose',    emoji: '⛈️', gradient: 'from-rose-400 to-rose-600' },
  unknown:  { label: 'Forecast unavailable', color: 'slate',   emoji: '❓', gradient: 'from-slate-400 to-slate-600' },
};

const fmtKm = (m) => (m / 1000).toFixed(0);
const fmtTime = (ms) =>
  new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const labelFor = (sample) =>
  sample.locality
    ? `Near ${sample.locality}`
    : sample.distFromStart === 0
      ? 'At start'
      : `${fmtKm(sample.distFromStart)} km mark`;

export default function WeatherPanel() {
  const { weather, weatherLoading, routes, activeRouteIdx } = useMapStore();
  const [expanded, setExpanded] = useState(true);

  const route = routes[activeRouteIdx];
  if (!route) return null;
  if (!weather?.samples?.length && !weatherLoading) return null;

  if (weatherLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-4 flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 grid place-items-center animate-pulse">
          <CloudRain size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium">Checking weather…</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fetching forecast for each segment of your route
          </p>
        </div>
      </motion.div>
    );
  }

  const { samples, summary } = weather;
  const meta = riskMeta[summary?.overallRisk || 'clear'];

  const rainSamples = samples
    .filter((s) => (s.forecast?.precipitationProbability || 0) >= 40)
    .sort(
      (a, b) =>
        (b.forecast?.precipitationProbability || 0) -
        (a.forecast?.precipitationProbability || 0)
    );

  const visibleSamples = samples.length > 6
    ? [
        samples[0],
        ...samples
          .filter(
            (_, i) =>
              i > 0 &&
              i < samples.length - 1 &&
              i % Math.ceil(samples.length / 5) === 0
          )
          .slice(0, 4),
        samples[samples.length - 1],
      ]
    : samples;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl overflow-hidden w-full"
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full p-4 flex items-center gap-3 transition hover:bg-white/30 dark:hover:bg-white/5"
      >
        <div
          className={`h-14 w-14 rounded-2xl grid place-items-center text-white shadow-xl shrink-0 bg-gradient-to-br ${meta.gradient}`}
        >
          <span className="text-3xl">{meta.emoji}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-bold text-base flex items-center gap-1.5">
            {meta.label}
            <Sparkles size={12} className="text-brand-500" />
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {summary?.willRain ? (
              <>
                <Umbrella size={11} className="inline mr-0.5" />
                Rain at {summary.rainSampleCount} location
                {summary.rainSampleCount > 1 ? 's' : ''} along route
              </>
            ) : summary?.avgTempC != null ? (
              <>
                <Thermometer size={11} className="inline mr-0.5" />
                Average ~{summary.avgTempC}°C along route
              </>
            ) : (
              'Forecast available'
            )}
          </p>
        </div>
        <ChevronDown
          size={20}
          className={`text-slate-400 shrink-0 transition ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {rainSamples.length > 0 && (
              <div className="mx-4 mb-3 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-rose-500/10 overflow-hidden">
                <div className="px-3 py-2 bg-amber-500/15 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Rain Locations
                  </span>
                  <span className="ml-auto text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                    {rainSamples.length}
                  </span>
                </div>
                <div className="p-2 space-y-1.5">
                  {rainSamples.map((s, i) => {
                    const f = s.forecast;
                    const { Icon, color } = conditionIcon(f?.conditionType, f?.condition);
                    return (
                      <motion.div
                        key={s.distFromStart}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-white/50 dark:bg-white/5 rounded-lg p-2.5 flex items-center gap-3"
                      >
                        <div
                          className="h-9 w-9 rounded-full grid place-items-center shrink-0"
                          style={{ background: `${color}30` }}
                        >
                          <Icon size={18} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate flex items-center gap-1">
                            <MapPin size={11} className="text-rose-500 shrink-0" />
                            {labelFor(s)}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                            {f?.condition || 'Rain'}
                            {f?.temperatureC !== undefined && ` · ${Math.round(f.temperatureC)}°C`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 justify-end">
                            <Droplets size={12} />
                            {f.precipitationProbability}%
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5 justify-end">
                            <Clock size={9} /> {fmtTime(s.etaMs)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {summary?.overallRisk === 'severe' && rainSamples.length === 0 && summary.worstAt && (
              <div className="mx-4 mb-3 rounded-xl px-3 py-2.5 bg-rose-500/15 border border-rose-500/30 flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <div>
                  <strong className="font-semibold">{summary.worstAt.condition}</strong>{' '}
                  expected{' '}
                  {summary.worstAt.locality
                    ? `near ${summary.worstAt.locality}`
                    : `at km ${fmtKm(summary.worstAt.distFromStart)}`}{' '}
                  around {fmtTime(summary.worstAt.etaMs)}
                </div>
              </div>
            )}

            <div className="px-3 pb-3 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 pt-1">
                Forecast timeline
              </p>
              {visibleSamples.map((s, i) => {
                const f = s.forecast;
                const { Icon, color } = conditionIcon(f?.conditionType, f?.condition);
                const isStart = i === 0;
                const isEnd = i === visibleSamples.length - 1;

                return (
                  <motion.div
                    key={s.distFromStart}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl p-2.5 flex items-center gap-3 hover:scale-[1.01] transition"
                  >
                    <div
                      className="h-10 w-10 rounded-full grid place-items-center shrink-0 shadow-sm"
                      style={{ background: `${color}25` }}
                    >
                      <Icon size={20} style={{ color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        {isStart && !s.locality
                          ? 'Departure'
                          : isEnd && !s.locality
                            ? 'Arrival'
                            : labelFor(s)}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-2">
                        <span>{fmtTime(s.etaMs)}</span>
                        {f?.condition && <span>· {f.condition}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {f?.temperatureC !== undefined && (
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {Math.round(f.temperatureC)}°
                        </span>
                      )}
                      {f?.precipitationProbability > 0 && (
                        <span className="text-[11px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold">
                          <Droplets size={10} />
                          {f.precipitationProbability}%
                        </span>
                      )}
                      <span
                        className={`h-2 w-2 rounded-full ${
                          s.risk === 'severe'   ? 'bg-rose-500' :
                          s.risk === 'moderate' ? 'bg-amber-500' :
                          s.risk === 'mild'     ? 'bg-sky-500' :
                          s.risk === 'clear'    ? 'bg-emerald-500' :
                                                  'bg-slate-400'
                        }`}
                      />
                    </div>
                  </motion.div>
                );
              })}

              <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 pt-2">
                Powered by Google AI weather models · forecast at predicted arrival times
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}