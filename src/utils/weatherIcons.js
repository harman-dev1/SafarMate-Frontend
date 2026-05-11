import {
  Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog,
  CloudDrizzle, Wind,
} from 'lucide-react';

export const conditionIcon = (type, condition = '') => {
  const t = (type || condition || '').toLowerCase();
  if (/thunder|storm|lightning/.test(t)) return { Icon: CloudLightning, color: '#a78bfa' };
  if (/heavy.*rain|heavy_rain/.test(t)) return { Icon: CloudRain, color: '#3b82f6' };
  if (/drizzle|light.*rain/.test(t)) return { Icon: CloudDrizzle, color: '#7dd3fc' };
  if (/rain|shower/.test(t)) return { Icon: CloudRain, color: '#38bdf8' };
  if (/snow|ice|sleet/.test(t)) return { Icon: CloudSnow, color: '#bae6fd' };
  if (/fog|mist|haze/.test(t)) return { Icon: CloudFog, color: '#94a3b8' };
  if (/cloud/.test(t)) return { Icon: Cloud, color: '#cbd5e1' };
  if (/wind/.test(t)) return { Icon: Wind, color: '#a3a3a3' };
  return { Icon: Sun, color: '#facc15' };
};

export const RISK_COLORS = {
  clear:    '#22c55e',
  mild:     '#38bdf8',
  moderate: '#f59e0b',
  severe:   '#ef4444',
  unknown:  '#94a3b8',
};