import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { signInWithGoogle } from '@/services/firebase';
import { apiGoogleLogin } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import ThemeToggle from '@/components/ThemeToggle.jsx';

export default function LoginPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const cred = await signInWithGoogle();
      const idToken = await cred.user.getIdToken();
      const { data } = await apiGoogleLogin(idToken);
      setAuth(data.data.user, data.data.token);
      toast.success(`Welcome, ${data.data.user.displayName.split(' ')[0]}!`);
      nav('/app');
    } catch (e) {
      console.error(e);
      toast.error('Sign-in failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-dvh grid place-items-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-strong rounded-3xl p-8 w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center shadow-glow mb-4">
            <Compass className="text-white" size={26} />
          </div>
          <h1 className="font-display font-bold text-2xl">Welcome to SafarMate</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Sign in with Google to start exploring smarter routes.
          </p>
        </div>

        <button
          onClick={handleGoogle} disabled={loading}
          className="mt-8 w-full glass rounded-2xl py-3 px-4 flex items-center justify-center gap-3 hover:scale-[1.01] transition disabled:opacity-60"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <FcGoogle size={22} />}
          <span className="font-medium">{loading ? 'Signing in…' : 'Continue with Google'}</span>
        </button>

        <p className="text-[11px] text-center mt-6 text-slate-500 dark:text-slate-400">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}