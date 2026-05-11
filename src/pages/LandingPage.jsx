import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Compass, Map, ShieldCheck, Route, Layers, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle.jsx';

const Feature = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ delay, duration: 0.5 }}
    className="glass rounded-2xl p-5"
  >
    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white mb-3 shadow-glow">
      <Icon size={20} />
    </div>
    <h3 className="font-display font-semibold mb-1">{title}</h3>
    <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
  </motion.div>
);

export default function LandingPage() {
  const nav = useNavigate();
  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* gradient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center shadow-glow">
            <Compass className="text-white" size={20} />
          </div>
          <span className="font-display font-bold text-xl">SafarMate</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => nav('/login')} className="btn-primary hidden sm:inline-flex">Sign in</button>
        </div>
      </header>

      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs font-medium mb-6"
        >
          <Sparkles size={12} className="text-brand-500" />
          AI-powered, community-driven travel companion
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
          className="font-display font-bold text-4xl md:text-6xl lg:text-7xl tracking-tight"
        >
          Smarter, safer
          <span className="block bg-gradient-to-r from-brand-500 via-brand-400 to-purple-500 bg-clip-text text-transparent">
            journeys ahead.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300"
        >
          Real-time incident reports, weather-aware routing, and emergency assistance — all in one premium navigation experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-10 flex items-center justify-center gap-3 flex-wrap"
        >
          <button onClick={() => nav('/login')} className="btn-primary text-base px-6 py-3">
            <Compass size={18} /> Start exploring
          </button>
          <button onClick={() => nav('/login')} className="btn-ghost text-base px-6 py-3">
            Continue as guest
          </button>
        </motion.div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Feature icon={Map} title="Live, premium maps" desc="Beautiful tiles, smooth gestures, dark & light themes." delay={0.05} />
        <Feature icon={Route} title="Smart routing" desc="Multi-stop, alternatives, and real-time recalculation." delay={0.1} />
        <Feature icon={Layers} title="Heatmaps & layers" desc="Traffic, weather, incidents — togglable overlays." delay={0.15} />
        <Feature icon={ShieldCheck} title="Emergency SOS" desc="One-tap alerts to nearby users and responders." delay={0.2} />
        <Feature icon={Sparkles} title="AI safety scores" desc="Routes scored by road quality, weather and incidents." delay={0.25} />
        <Feature icon={Compass} title="Built for everyone" desc="From daily commuters to delivery riders and travelers." delay={0.3} />
      </section>
    </div>
  );
}