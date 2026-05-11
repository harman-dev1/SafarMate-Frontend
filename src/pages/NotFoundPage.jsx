import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="glass-strong rounded-2xl p-10 text-center">
        <h1 className="font-display text-5xl font-bold mb-2">404</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-4">This route doesn't exist on the map.</p>
        <Link to="/" className="btn-primary">Take me home</Link>
      </div>
    </div>
  );
}