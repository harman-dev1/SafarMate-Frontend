import { Plus, Minus, Locate, Layers, AlertTriangle } from 'lucide-react';
import { useMapStore } from '@/store/mapStore';

const Btn = ({ children, ...p }) => (
  <button className="btn-icon" {...p}>{children}</button>
);

export default function MapControls({ onToggleLayers, onSOS }) {
  const { setFollow, follow } = useMapStore();

  return (
    <div className="absolute right-4 bottom-28 lg:bottom-8 z-20 flex flex-col gap-2">
      <Btn onClick={() => window.dispatchEvent(new CustomEvent('safarmate:zoom', { detail: 1 }))}>
        <Plus size={18} />
      </Btn>
      <Btn onClick={() => window.dispatchEvent(new CustomEvent('safarmate:zoom', { detail: -1 }))}>
        <Minus size={18} />
      </Btn>
      <button
        onClick={() => setFollow(!follow)}
        title="Re-center"
        className={`btn-icon ${follow ? 'ring-2 ring-brand-500' : ''}`}
      >
        <Locate size={18} />
      </button>
      <Btn onClick={onToggleLayers} title="Layers"><Layers size={18} /></Btn>
      <button
        onClick={onSOS}
        className="h-12 w-12 rounded-full grid place-items-center bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse-glow"
        title="SOS"
      >
        <AlertTriangle size={20} />
      </button>
    </div>
  );
}