import { useEffect, useMemo, useRef, useState } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useTheme } from '@/context/ThemeContext';
import { useMapStore } from '@/store/mapStore';
import { useIncidentStore } from '@/store/incidentStore';
import { conditionIcon, RISK_COLORS } from '@/utils/weatherIcons';

const MAP_ID_LIGHT = 'safarmate_light';
const MAP_ID_DARK = 'safarmate_dark';

const categoryColors = {
  hospital: '#ef4444', fuel: '#f59e0b', restaurant: '#fb923c', police: '#3b82f6',
  parking: '#64748b', ev_charging: '#10b981', pharmacy: '#ec4899', atm: '#6366f1',
};

// Traffic speed → polyline color
const SPEED_COLORS = {
  NORMAL:       '#10b981', // green
  SLOW:         '#f59e0b', // orange
  TRAFFIC_JAM:  '#ef4444', // red
};
const DEFAULT_ROUTE_COLOR = '#3b82f6'; // blue fallback when no traffic data

const LabeledPin = ({ color, label }) => (
  <div style={{
    width: 44, height: 55, cursor: 'pointer',
    filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.45))',
    transform: 'translateY(-27px)',
  }}>
    <svg width="44" height="55" viewBox="0 0 32 40">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z"
        fill={color} stroke="white" strokeWidth="2.5" />
      <text x="16" y="22" textAnchor="middle" fill="white" fontWeight="800" fontSize="14"
        fontFamily="system-ui, -apple-system, sans-serif">{label}</text>
    </svg>
  </div>
);

const HeadingArrow = ({ rotation = 0 }) => (
  <div style={{
    width: 36, height: 36,
    transform: `rotate(${rotation}deg)`, transformOrigin: 'center',
    transition: 'transform 0.5s ease-out',
  }}>
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="#3b82f6" stroke="white" strokeWidth="3" />
      <path d="M18 8 L24 22 L18 19 L12 22 Z" fill="white" />
    </svg>
  </div>
);

const validPoint = (p) =>
  p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0);

const Polyline = ({ path, color = '#3b82f6', weight = 6, opacity = 1, zIndex = 1 }) => {
  const map = useMap();
  const polylineRef = useRef(null);
  useEffect(() => {
    if (!map || !path?.length) return;
    const pl = new google.maps.Polyline({
      path: path.map(([lng, lat]) => ({ lat, lng })),
      geodesic: true, strokeColor: color, strokeOpacity: opacity,
      strokeWeight: weight, zIndex,
    });
    pl.setMap(map);
    polylineRef.current = pl;
    return () => pl.setMap(null);
  }, [map, path, color, weight, opacity, zIndex]);
  return null;
};

// ── Traffic-colored active route ──
// Splits the route polyline into per-speed segments based on Google's
// speedReadingIntervals (NORMAL → green, SLOW → orange, TRAFFIC_JAM → red).
const TrafficColoredRoute = ({ route, weight = 6, zIndex = 2 }) => {
  const coords = route?.geometry?.coordinates;
  const intervals = route?.speedReadingIntervals;

  if (!coords?.length) return null;

  // No traffic data (cycling/walking, or API didn't return intervals) — single blue line
  if (!intervals?.length) {
    return (
      <Polyline path={coords} color={DEFAULT_ROUTE_COLOR} weight={weight} zIndex={zIndex} />
    );
  }

  return (
    <>
      {intervals.map((iv, idx) => {
        const start = iv.startPolylinePointIndex ?? 0;
        const end   = (iv.endPolylinePointIndex ?? 0) + 1; // inclusive
        const slice = coords.slice(start, end);
        if (slice.length < 2) return null;
        const color = SPEED_COLORS[iv.speed] || DEFAULT_ROUTE_COLOR;
        return (
          <Polyline
            key={`traffic-${idx}-${start}-${end}`}
            path={slice}
            color={color}
            weight={weight}
            zIndex={zIndex}
          />
        );
      })}
    </>
  );
};

// ── Weather-tinted polyline segments (planning view only) ──
const WeatherSegments = ({ activeRoute, weatherSamples }) => {
  const segments = useMemo(() => {
    if (!activeRoute?.geometry?.coordinates?.length || !weatherSamples?.length) return [];
    const coords = activeRoute.geometry.coordinates;

    const cum = [0];
    for (let i = 0; i < coords.length - 1; i++) {
      const a = { lat: coords[i][1], lng: coords[i][0] };
      const b = { lat: coords[i + 1][1], lng: coords[i + 1][0] };
      const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
      const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
      const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
      cum.push(cum[i] + R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
    }
    const findIdxAtDist = (d) => {
      for (let i = 0; i < cum.length - 1; i++) {
        if (cum[i + 1] >= d) return i + 1;
      }
      return cum.length - 1;
    };

    const segs = [];
    for (let i = 0; i < weatherSamples.length - 1; i++) {
      const a = weatherSamples[i];
      const b = weatherSamples[i + 1];
      const idxA = findIdxAtDist(a.distFromStart);
      const idxB = findIdxAtDist(b.distFromStart);
      const slice = coords.slice(idxA, idxB + 1);
      const ranks = { clear: 0, mild: 1, moderate: 2, severe: 3, unknown: 0 };
      const worstRisk = ranks[a.risk] >= ranks[b.risk] ? a.risk : b.risk;
      if (slice.length >= 2) {
        segs.push({ coords: slice, risk: worstRisk, key: `wseg-${i}` });
      }
    }
    return segs;
  }, [activeRoute, weatherSamples]);

  return (
    <>
      {segments.map((s) => (
        <Polyline
          key={s.key}
          path={s.coords}
          color={RISK_COLORS[s.risk] || RISK_COLORS.unknown}
          weight={3}
          opacity={s.risk === 'clear' ? 0 : 0.9}
          zIndex={4}
        />
      ))}
    </>
  );
};

// ── Weather marker — bigger and glowier during navigation ──
const WeatherRouteMarker = ({ sample, isNav = false }) => {
  const f = sample.forecast;
  const { Icon, color } = conditionIcon(f?.conditionType, f?.condition);
  const riskColor = RISK_COLORS[sample.risk] || RISK_COLORS.unknown;
  const size = isNav ? 46 : 38;
  const iconSize = isNav ? 24 : 20;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'white',
        border: `${isNav ? 3.5 : 2.5}px solid ${riskColor}`,
        boxShadow: isNav
          ? `0 4px 16px rgba(0,0,0,0.55), 0 0 0 6px ${riskColor}30, 0 0 24px ${riskColor}55`
          : '0 4px 12px rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: isNav ? 'default' : 'pointer',
        transition: 'transform 0.15s ease-out',
      }}
      onMouseEnter={!isNav ? (e) => (e.currentTarget.style.transform = 'scale(1.1)') : undefined}
      onMouseLeave={!isNav ? (e) => (e.currentTarget.style.transform = 'scale(1)') : undefined}
    >
      <Icon size={iconSize} color={color} strokeWidth={2.4} />
    </div>
  );
};

// ── Incident pin component ──
const INCIDENT_META = {
  pothole:      { emoji: '🕳️', color: '#f59e0b' },
  roadblock:    { emoji: '🚧', color: '#ef4444' },
  construction: { emoji: '🏗️', color: '#facc15' },
  flooding:     { emoji: '🌊', color: '#3b82f6' },
  checkpoint:   { emoji: '👮', color: '#6366f1' },
  obstacle:     { emoji: '🐄', color: '#f97316' },
};

const IncidentPin = ({ incident, dim, isNav }) => {
  const meta = INCIDENT_META[incident.type] || { emoji: '⚠️', color: '#94a3b8' };
  const size = isNav ? 38 : 34;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'white',
        border: `3px solid ${meta.color}`,
        boxShadow: isNav
          ? `0 4px 14px rgba(0,0,0,0.5), 0 0 0 5px ${meta.color}30`
          : '0 3px 10px rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        fontSize: size * 0.5,
        lineHeight: 1,
        opacity: dim ? 0.55 : 1,
        transition: 'transform 0.15s ease-out',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <span aria-hidden>{meta.emoji}</span>
    </div>
  );
};

const fmtKmShort = (m) => (m / 1000).toFixed(0);
const fmtTimeShort = (ms) =>
  new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const MapBridge = ({
  routes, activeRouteIdx, nearbyPlaces, selectedPlace,
  follow, userLocation, isNavigating, userHeading,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const onZoom = (e) => {
      const cur = map.getZoom();
      map.setZoom(cur + (e.detail > 0 ? 1 : -1));
    };
    window.addEventListener('safarmate:zoom', onZoom);
    return () => window.removeEventListener('safarmate:zoom', onZoom);
  }, [map]);

  useEffect(() => {
    if (!map || !selectedPlace || isNavigating) return;
    map.panTo({ lat: selectedPlace.lat, lng: selectedPlace.lng });
    map.setZoom(15);
  }, [map, selectedPlace, isNavigating]);

  useEffect(() => {
    if (isNavigating) return;
    const r = routes[activeRouteIdx];
    if (!map || !r?.geometry?.coordinates?.length) return;
    const bounds = new google.maps.LatLngBounds();
    r.geometry.coordinates.forEach(([lng, lat]) => bounds.extend({ lat, lng }));
    map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });
  }, [map, routes, activeRouteIdx, isNavigating]);

  useEffect(() => {
    if (!map || !nearbyPlaces.length || isNavigating) return;
    const bounds = new google.maps.LatLngBounds();
    nearbyPlaces.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
  }, [map, nearbyPlaces, isNavigating]);

  useEffect(() => {
    if (!map || !follow || !userLocation || isNavigating) return;
    map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    map.setZoom(15);
  }, [map, follow, userLocation, isNavigating]);

  useEffect(() => {
    if (!map) return;
    if (isNavigating && userLocation) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(17);
      try {
        map.setTilt(50);
        if (Number.isFinite(userHeading)) map.setHeading(userHeading);
      } catch {}
    } else if (!isNavigating) {
      try { map.setTilt(0); map.setHeading(0); } catch {}
    }
  }, [map, isNavigating, userLocation, userHeading]);

  return null;
};

export default function MapContainer({
  initialCenter = { lng: 74.3587, lat: 31.5204 },
  initialZoom = 12,
}) {
  const { theme } = useTheme();
  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }, [theme]);

  const {
    userLocation, userHeading, follow,
    selectedPlace,
    origin, destination, waypoints,
    routes, activeRouteIdx,
    nearbyPlaces,
    isNavigating, weather, layers,
  } = useMapStore();

  const { incidents, setSelectedIncident } = useIncidentStore();
  const showIncidents = layers.incidents;
  const showTrafficColors = layers.traffic;

  const [popupPlace, setPopupPlace] = useState(null);
  const [showSelectedPopup, setShowSelectedPopup] = useState(false);
  const [routeStopPopup, setRouteStopPopup] = useState(null);
  const [weatherPopup, setWeatherPopup] = useState(null);

  useEffect(() => { if (selectedPlace) setShowSelectedPopup(true); }, [selectedPlace]);
  useEffect(() => { if (isNavigating) setWeatherPopup(null); }, [isNavigating]);

  const routePaths = useMemo(
    () => routes.map((r, i) => ({
      id: i,
      path: r.geometry?.coordinates || [],
      active: i === activeRouteIdx,
    })),
    [routes, activeRouteIdx]
  );

  const activeRoute = routes[activeRouteIdx];
  const weatherSamples = layers.weather ? weather?.samples : null;
  const weatherMarkers = (() => {
    if (!weatherSamples?.length) return [];
    const middle = weatherSamples.slice(1, -1);
    return middle.length > 0 ? middle : weatherSamples;
  })();

  return (
    <Map
      mapId={isDark ? MAP_ID_DARK : MAP_ID_LIGHT}
      defaultCenter={{ lat: initialCenter.lat, lng: initialCenter.lng }}
      defaultZoom={initialZoom}
      gestureHandling="greedy"
      disableDefaultUI={true}
      colorScheme={isDark ? 'DARK' : 'LIGHT'}
      style={{ width: '100%', height: '100%' }}
      reuseMaps
    >
      <MapBridge
        routes={routes} activeRouteIdx={activeRouteIdx} nearbyPlaces={nearbyPlaces}
        selectedPlace={selectedPlace} follow={follow} userLocation={userLocation}
        isNavigating={isNavigating} userHeading={userHeading}
      />

      {validPoint(userLocation) && (
        <AdvancedMarker position={{ lat: userLocation.lat, lng: userLocation.lng }} zIndex={10}>
          {isNavigating
            ? <HeadingArrow rotation={userHeading || 0} />
            : <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: '#3b82f6', border: '3px solid white',
                boxShadow: '0 0 0 4px rgba(59,130,246,0.35), 0 2px 8px rgba(0,0,0,0.3)',
              }} />
          }
        </AdvancedMarker>
      )}

      {!isNavigating && validPoint(origin) && (
        <AdvancedMarker
          position={{ lat: origin.lat, lng: origin.lng }}
          onClick={() => setRouteStopPopup({ ...origin, _label: 'Starting Point' })}
          zIndex={6}
        ><LabeledPin color="#10b981" label="A" /></AdvancedMarker>
      )}

      {!isNavigating && waypoints.map((wp, i) =>
        validPoint(wp) ? (
          <AdvancedMarker
            key={`wp-${i}-${wp.lat}-${wp.lng}`}
            position={{ lat: wp.lat, lng: wp.lng }}
            onClick={() => setRouteStopPopup({ ...wp, _label: `Stop ${i + 1}` })}
            zIndex={5}
          ><LabeledPin color="#f59e0b" label={String(i + 1)} /></AdvancedMarker>
        ) : null
      )}

      {!isNavigating && validPoint(destination) && (
        <AdvancedMarker
          position={{ lat: destination.lat, lng: destination.lng }}
          onClick={() => setRouteStopPopup({ ...destination, _label: 'Destination' })}
          zIndex={6}
        ><LabeledPin color="#ef4444" label="B" /></AdvancedMarker>
      )}

      {!isNavigating && routeStopPopup && (
        <InfoWindow
          position={{ lat: routeStopPopup.lat, lng: routeStopPopup.lng }}
          pixelOffset={[0, -50]}
          onCloseClick={() => setRouteStopPopup(null)}
        >
          <div style={{ minWidth: 180 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6, marginBottom: 4 }}>
              {routeStopPopup._label}
            </div>
            <b>{routeStopPopup.name || 'Selected location'}</b>
            {routeStopPopup.address && (
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{routeStopPopup.address}</div>
            )}
          </div>
        </InfoWindow>
      )}

      {!isNavigating && selectedPlace && !validPoint(origin) && !validPoint(destination) && (
        <>
          <AdvancedMarker
            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            onClick={() => setShowSelectedPopup(true)}
          ><LabeledPin color="#3b82f6" label="•" /></AdvancedMarker>
          {showSelectedPopup && (
            <InfoWindow
              position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
              pixelOffset={[0, -50]}
              onCloseClick={() => setShowSelectedPopup(false)}
            >
              <div style={{ minWidth: 180 }}>
                <b>{selectedPlace.name}</b>
                <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{selectedPlace.address}</div>
              </div>
            </InfoWindow>
          )}
        </>
      )}

      {/* Inactive routes — always grey, never traffic-colored */}
      {routePaths.map((rp) =>
        !rp.active && rp.path.length && !isNavigating ? (
          <Polyline key={`route-inactive-${rp.id}`} path={rp.path}
            color="#94a3b8" weight={5} opacity={0.55} zIndex={1} />
        ) : null
      )}

      {/* Active route — traffic-colored segments when intervals available + toggle on,
          otherwise plain blue. Replaces the old single-blue render. */}
      {activeRoute?.geometry?.coordinates?.length ? (
        showTrafficColors ? (
          <TrafficColoredRoute
            key={`route-active-traffic-${activeRouteIdx}`}
            route={activeRoute}
            weight={isNavigating ? 8 : 6}
            zIndex={2}
          />
        ) : (
          <Polyline
            key={`route-active-plain-${activeRouteIdx}`}
            path={activeRoute.geometry.coordinates}
            color={DEFAULT_ROUTE_COLOR}
            weight={isNavigating ? 8 : 6}
            opacity={1}
            zIndex={2}
          />
        )
      ) : null}

      {/* Weather risk colored polyline (planning only) — overlays on top */}
      {activeRoute && weatherSamples?.length > 1 && !isNavigating && (
        <WeatherSegments activeRoute={activeRoute} weatherSamples={weatherSamples} />
      )}

      {/* Weather markers — visible during navigation too, bigger + glowier */}
      {weatherMarkers.map((s) => (
        <AdvancedMarker
          key={`wmark-${s.distFromStart}`}
          position={{ lat: s.lat, lng: s.lng }}
          zIndex={4}
          onClick={() => !isNavigating && setWeatherPopup(s)}
        >
          <WeatherRouteMarker sample={s} isNav={isNavigating} />
        </AdvancedMarker>
      ))}

      {/* Weather marker info window — only when not navigating */}
      {weatherPopup && !isNavigating && (
        <InfoWindow
          position={{ lat: weatherPopup.lat, lng: weatherPopup.lng }}
          pixelOffset={[0, -22]}
          onCloseClick={() => setWeatherPopup(null)}
        >
          <div style={{ minWidth: 200 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6, marginBottom: 4 }}>
              {weatherPopup.locality
                ? `Near ${weatherPopup.locality}`
                : `${fmtKmShort(weatherPopup.distFromStart)} km mark`}
            </div>
            <b>{weatherPopup.forecast?.condition || 'No data'}</b>
            <div style={{ fontSize: 13, marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {weatherPopup.forecast?.temperatureC !== undefined && (
                <span>🌡️ {Math.round(weatherPopup.forecast.temperatureC)}°C</span>
              )}
              {weatherPopup.forecast?.precipitationProbability > 0 && (
                <span>💧 {weatherPopup.forecast.precipitationProbability}%</span>
              )}
              {weatherPopup.forecast?.windKmh > 0 && (
                <span>💨 {Math.round(weatherPopup.forecast.windKmh)} km/h</span>
              )}
            </div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.7 }}>
              ⏰ Arriving {fmtTimeShort(weatherPopup.etaMs)}
            </div>
          </div>
        </InfoWindow>
      )}

      {/* Incident pins — visible during navigation too */}
      {showIncidents && incidents.map((inc) => (
        <AdvancedMarker
          key={`inc-${inc._id}`}
          position={{ lat: inc.location.coordinates[1], lng: inc.location.coordinates[0] }}
          zIndex={5}
          onClick={() => !isNavigating && setSelectedIncident(inc)}
        >
          <IncidentPin
            incident={inc}
            dim={(inc.confirmations || 0) < 1}
            isNav={isNavigating}
          />
        </AdvancedMarker>
      ))}

      {!isNavigating && nearbyPlaces.map((p) => {
        const color = categoryColors[p.category] || '#3b82f6';
        return (
          <AdvancedMarker key={p.id} position={{ lat: p.lat, lng: p.lng }} onClick={() => setPopupPlace(p)}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: color, border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
            </div>
          </AdvancedMarker>
        );
      })}

      {!isNavigating && popupPlace && (
        <InfoWindow
          position={{ lat: popupPlace.lat, lng: popupPlace.lng }}
          pixelOffset={[0, -16]}
          onCloseClick={() => setPopupPlace(null)}
        >
          <div style={{ minWidth: 180 }}>
            <b>{popupPlace.name}</b>
            <div style={{ fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6 }}>
              {popupPlace.category.replace('_', ' ')}
            </div>
            {popupPlace.address && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{popupPlace.address}</div>}
            {popupPlace.rating && (
              <div style={{ fontSize: 12, marginTop: 4 }}>
                ⭐ {popupPlace.rating} ({popupPlace.ratingCount || 0})
              </div>
            )}
            {popupPlace.phone && <div style={{ fontSize: 12, marginTop: 4 }}>📞 {popupPlace.phone}</div>}
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}