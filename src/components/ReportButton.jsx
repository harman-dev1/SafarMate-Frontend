import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import { useIncidentStore } from '@/store/incidentStore';
import { useMapStore } from '@/store/mapStore';
import toast from 'react-hot-toast';

export default function ReportButton() {
  const { openReportModal } = useIncidentStore();
  const { userLocation, isNavigating } = useMapStore();

  const handleClick = () => {
    if (!userLocation) {
      return toast.error('Waiting for your location…');
    }
    openReportModal();
  };

  // Hide during navigation — the map UI is intentionally minimal then
  if (isNavigating) return null;

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="absolute bottom-4 left-4 z-30 h-12 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold flex items-center gap-2 shadow-2xl shadow-amber-500/40 transition"
      title="Report a road incident"
      aria-label="Report incident"
    >
      <Megaphone size={18} />
      <span>Report</span>
    </motion.button>
  );
}