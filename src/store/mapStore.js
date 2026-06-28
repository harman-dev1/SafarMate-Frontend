import { create } from 'zustand';

export const useMapStore = create((set, get) => ({
  // ── User position ──
  userLocation: null,
  userHeading: null,
  follow: false,
  setUserLocation: (loc) => set({ userLocation: loc }),
  setUserHeading: (h) => set({ userHeading: h }),
  setFollow: (v) => set({ follow: v }),

  // ── Selected place ──
  selectedPlace: null,
  setSelectedPlace: (p) => set({ selectedPlace: p }),

  // ── Routing ──
  origin: null,
  destination: null,
  waypoints: [],
  routes: [],
  activeRouteIdx: 0,
  transportMode: 'driving',
  avoidFeatures: [],
  setOrigin: (o) => set({ origin: o }),
  setDestination: (d) => set({ destination: d }),
  addWaypoint: (w = null) => set((s) => ({ waypoints: [...s.waypoints, w] })),
  setWaypointAt: (i, w) =>
    set((s) => ({ waypoints: s.waypoints.map((x, idx) => (idx === i ? w : x)) })),
  removeWaypoint: (i) =>
    set((s) => ({ waypoints: s.waypoints.filter((_, idx) => idx !== i) })),
  setRoutes: (r) => set({ routes: r, activeRouteIdx: 0, weather: null }),
  setActiveRoute: (i) => set({ activeRouteIdx: i, weather: null }),
  setTransportMode: (m) => set({ transportMode: m }),
  toggleAvoid: (feature) =>
    set((s) => ({
      avoidFeatures: s.avoidFeatures.includes(feature)
        ? s.avoidFeatures.filter((f) => f !== feature)
        : [...s.avoidFeatures, feature],
    })),
  clearRoute: () =>
    set({
      origin: null, destination: null, waypoints: [], routes: [],
      avoidFeatures: [], weather: null,
    }),

  // ── Navigation ──
  isNavigating: false,
  voiceMuted: false,
  currentStepIdx: 0,
  distanceToStep: 0,
  remainingDistance: 0,
  remainingDuration: 0,
  offRoute: false,
  hasArrived: false,
  startNavigation: () =>
    set({ isNavigating: true, currentStepIdx: 0, offRoute: false, hasArrived: false }),
  stopNavigation: () =>
    set({
      isNavigating: false, currentStepIdx: 0, distanceToStep: 0,
      remainingDistance: 0, remainingDuration: 0, offRoute: false, hasArrived: false,
    }),
  setNavProgress: (patch) => set(patch),
  toggleVoiceMute: () => set((s) => ({ voiceMuted: !s.voiceMuted })),

  // ── Weather along route ──
weather: null,
weatherLoading: false,
setWeather: (w) => set({ weather: w }),
setWeatherLoading: (v) => set({ weatherLoading: v }),
// ── Safety score along route ──
safety: null,
safetyLoading: false,
setSafety: (s) => set({ safety: s }),
setSafetyLoading: (v) => set({ safetyLoading: v }),
// ── Layers (traffic ON by default — primary route visualization) ──
layers: { traffic: true, safety: false, weather: true, incidents: true },
toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),

  // ── Nearby ──
  nearbyCategory: null,
  nearbyPlaces: [],
  setNearby: (cat, places) => set({ nearbyCategory: cat, nearbyPlaces: places }),
  clearNearby: () => set({ nearbyCategory: null, nearbyPlaces: [] }),
}));