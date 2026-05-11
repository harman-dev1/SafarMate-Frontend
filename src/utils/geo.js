// Earth radius in meters
const R = 6371000;
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

/** Great-circle distance in meters between two {lat, lng} points */
export const distanceMeters = (a, b) => {
  if (!a || !b) return Infinity;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

/** Initial bearing from a to b (0–360, where 0 = north) */
export const bearing = (a, b) => {
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

/**
 * For a route polyline (array of [lng, lat]), find the closest point on the
 * polyline to `pt` ({lat, lng}). Returns {distance, segmentIndex, projectedPoint}.
 */
export const projectOnPolyline = (pt, lineCoords) => {
  let best = { distance: Infinity, segmentIndex: 0, projectedPoint: pt };

  for (let i = 0; i < lineCoords.length - 1; i++) {
    const a = { lng: lineCoords[i][0], lat: lineCoords[i][1] };
    const b = { lng: lineCoords[i + 1][0], lat: lineCoords[i + 1][1] };

    // Approx flat projection (good enough for short segments)
    const ax = a.lng, ay = a.lat;
    const bx = b.lng, by = b.lat;
    const px = pt.lng, py = pt.lat;

    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    const proj = { lng: ax + t * dx, lat: ay + t * dy };
    const d = distanceMeters(pt, proj);

    if (d < best.distance) {
      best = { distance: d, segmentIndex: i, projectedPoint: proj, t };
    }
  }
  return best;
};

/**
 * Distance along a polyline from a starting segment+t to the end.
 * Returns total meters remaining after the current projected position.
 */
export const remainingMetersOnPolyline = (lineCoords, segmentIndex, t = 0) => {
  let total = 0;

  // Distance from current projected point to end of current segment
  if (segmentIndex < lineCoords.length - 1) {
    const a = { lng: lineCoords[segmentIndex][0], lat: lineCoords[segmentIndex][1] };
    const b = { lng: lineCoords[segmentIndex + 1][0], lat: lineCoords[segmentIndex + 1][1] };
    const segLen = distanceMeters(a, b);
    total += segLen * (1 - t);
  }
  // Sum the rest of the segments
  for (let i = segmentIndex + 1; i < lineCoords.length - 1; i++) {
    const a = { lng: lineCoords[i][0], lat: lineCoords[i][1] };
    const b = { lng: lineCoords[i + 1][0], lat: lineCoords[i + 1][1] };
    total += distanceMeters(a, b);
  }
  return total;
};

/** Format meters → "1.2 km" or "350 m" */
export const fmtDist = (m) => {
  if (!Number.isFinite(m) || m < 0) return '—';
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
};

/** Format seconds → "12 min" or "1h 23m" */
export const fmtDuration = (s) => {
  if (!Number.isFinite(s) || s < 0) return '—';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};