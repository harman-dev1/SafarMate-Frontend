import { useEffect, useMemo, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

// Risk-style ramp: green = safe, red = dangerous. Deliberately distinct
// from RISK_COLORS (weather) so the two overlays never read as the same
// thing on the map.
export const SAFETY_COLORS = {
  safe: '#16a34a',
  moderate: '#eab308',
  risky: '#f97316',
  dangerous: '#dc2626',
  unknown: '#94a3b8',
};

export const SAFETY_LABELS = {
  safe: 'Safe',
  moderate: 'Moderate',
  risky: 'Risky',
  dangerous: 'Dangerous',
};

// Minimal raw-Polyline drawer, same approach MapContainer.jsx uses for its
// own `Polyline` helper — kept local here so this file can be dropped in
// without exporting anything new from MapContainer.jsx.
const SafetyPolyline = ({ path, color, weight = 5, opacity = 0.85, zIndex = 5 }) => {
  const map = useMap();
  const ref = useRef(null);
  useEffect(() => {
    if (!map || !path?.length) return;
    const pl = new google.maps.Polyline({
      path: path.map(([lng, lat]) => ({ lat, lng })),
      geodesic: true,
      strokeColor: color,
      strokeOpacity: opacity,
      strokeWeight: weight,
      zIndex,
    });
    pl.setMap(map);
    ref.current = pl;
    return () => pl.setMap(null);
  }, [map, path, color, weight, opacity, zIndex]);
  return null;
};

/**
 * Draws the active route's safety-score samples as coloured polyline
 * segments, offset slightly so they sit alongside (not directly under)
 * the traffic-coloured route line. Mirrors the WeatherSegments pattern
 * in MapContainer.jsx: it maps each [sample_i, sample_i+1] pair onto the
 * matching slice of the route's own geometry using cumulative distance.
 *
 * Props:
 *   activeRoute   - routes[activeRouteIdx] from mapStore (needs .geometry.coordinates)
 *   safetySamples - safety.samples from mapStore (array of { distFromStart, liveBand, ... })
 */
export const SafetySegments = ({ activeRoute, safetySamples }) => {
  const segments = useMemo(() => {
    if (!activeRoute?.geometry?.coordinates?.length || !safetySamples?.length) return [];
    const coords = activeRoute.geometry.coordinates;

    // Cumulative distance along the route geometry (Haversine), so we can
    // map a sample's distFromStart back onto a slice of coordinates.
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const cum = [0];
    for (let i = 0; i < coords.length - 1; i++) {
      const a = { lat: coords[i][1], lng: coords[i][0] };
      const b = { lat: coords[i + 1][1], lng: coords[i + 1][0] };
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
      cum.push(cum[i] + R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
    }
    const idxAtDist = (d) => {
      for (let i = 0; i < cum.length - 1; i++) if (cum[i + 1] >= d) return i + 1;
      return cum.length - 1;
    };

    const sorted = [...safetySamples].sort((a, b) => a.distFromStart - b.distFromStart);
    const segs = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const idxA = idxAtDist(a.distFromStart);
      const idxB = idxAtDist(b.distFromStart);
      const slice = coords.slice(idxA, idxB + 1);
      if (slice.length >= 2) {
        segs.push({ coords: slice, band: a.liveBand || 'unknown', key: `safety-${a.segmentId || i}` });
      }
    }
    return segs;
  }, [activeRoute, safetySamples]);

  return (
    <>
      {segments.map((s) => (
        <SafetyPolyline
          key={s.key}
          path={s.coords}
          color={SAFETY_COLORS[s.band] || SAFETY_COLORS.unknown}
          weight={4}
          opacity={0.85}
          zIndex={5}
        />
      ))}
    </>
  );
};

/**
 * Small standalone legend block — drop into LayersPanel.jsx (or anywhere
 * else) wherever the layer's toggle is shown, the same way the existing
 * traffic legend appears under its own toggle.
 */
export const SafetyLegend = () => (
  <div className="flex flex-wrap items-center gap-3 px-1">
    {['safe', 'moderate', 'risky', 'dangerous'].map((band) => (
      <span key={band} className="flex items-center gap-1.5 text-[10px]">
        <span className="h-1 w-4 rounded-full" style={{ background: SAFETY_COLORS[band] }} />
        <span className="text-slate-600 dark:text-slate-300">{SAFETY_LABELS[band]}</span>
      </span>
    ))}
  </div>
);
