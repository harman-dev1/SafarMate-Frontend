import { useEffect, useRef } from 'react';
import { useMapStore } from '@/store/mapStore';
import {
  distanceMeters, bearing, projectOnPolyline, remainingMetersOnPolyline,
} from '@/utils/geo';
import { voice, cleanInstruction, distancePhrase } from '@/utils/voice';
import { apiComputeRoute } from '@/api/route';
import toast from 'react-hot-toast';

const OFF_ROUTE_THRESHOLD = 80;
const ARRIVAL_THRESHOLD = 30;
const VOICE_TRIGGERS = [600, 250, 80, 30];

export const useNavigation = () => {
  const {
    isNavigating, voiceMuted, routes, activeRouteIdx,
    destination, transportMode, avoidFeatures,
    setUserLocation, setUserHeading,
    setNavProgress, stopNavigation,
  } = useMapStore();

  const watchIdRef = useRef(null);
  const lastVoiceFireRef = useRef({});
  const reroutingRef = useRef(false);
  const offRouteSinceRef = useRef(0);
  const weatherAnnouncedRef = useRef(new Set()); // sample distFromStart values already spoken

  useEffect(() => {
    voice.setMuted(voiceMuted);
  }, [voiceMuted]);

  useEffect(() => {
    if (!isNavigating) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      voice.cancel();
      lastVoiceFireRef.current = {};
      offRouteSinceRef.current = 0;
      reroutingRef.current = false;
      weatherAnnouncedRef.current = new Set();
      return;
    }

    const route = routes[activeRouteIdx];
    if (!route?.geometry?.coordinates?.length) {
      toast.error('No active route to navigate');
      stopNavigation();
      return;
    }

    const coords = route.geometry.coordinates;
    const steps = route.steps || [];
    const stepSegIndex = computeStepSegmentIndices(coords, steps);

    const firstStep = steps[0];
    if (firstStep) {
      voice.say(`Starting navigation. ${cleanInstruction(firstStep.instruction)}`, { priority: 'high' });
    }

    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported');
      stopNavigation();
      return;
    }

    let prevPos = null;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading } = position.coords;
        const here = { lat: latitude, lng: longitude, accuracy: position.coords.accuracy };
        setUserLocation(here);

        let h = heading;
        if (h === null || h === undefined || Number.isNaN(h)) {
          if (prevPos) {
            const moved = distanceMeters(prevPos, here);
            if (moved > 3) h = bearing(prevPos, here);
          }
        }
        if (h !== null && !Number.isNaN(h)) setUserHeading(h);
        prevPos = here;

        const proj = projectOnPolyline(here, coords);

        if (proj.distance > OFF_ROUTE_THRESHOLD) {
          if (offRouteSinceRef.current === 0) offRouteSinceRef.current = Date.now();
          if (!reroutingRef.current && Date.now() - offRouteSinceRef.current > 5000) {
            handleReroute({ here, destination, transportMode, avoidFeatures });
          }
          setNavProgress({ offRoute: true });
        } else {
          offRouteSinceRef.current = 0;
          setNavProgress({ offRoute: false });
        }

        const userSegIdx = proj.segmentIndex;
        let currentStepIdx = 0;
        for (let i = 0; i < stepSegIndex.length; i++) {
          if (stepSegIndex[i] <= userSegIdx) currentStepIdx = i;
        }
        if (
          currentStepIdx < steps.length - 1 &&
          stepSegIndex[currentStepIdx + 1] - 1 <= userSegIdx
        ) {
          currentStepIdx += 1;
        }

        const nextStepIdx = Math.min(currentStepIdx + 1, steps.length - 1);
        const targetSegIdx =
          nextStepIdx < stepSegIndex.length ? stepSegIndex[nextStepIdx] : coords.length - 1;
        const distToNextStep = remainingMetersOnPolyline(
          coords.slice(0, targetSegIdx + 1), proj.segmentIndex, proj.t
        );
        const remainingMeters = remainingMetersOnPolyline(coords, proj.segmentIndex, proj.t);

        const totalDist = route.distance || 1;
        const totalDur = route.duration || 1;
        const remainingDuration = (remainingMeters / totalDist) * totalDur;

        // Distance covered along route (used for weather lookahead)
        const distCoveredFromStart = totalDist - remainingMeters;

        setNavProgress({
          currentStepIdx,
          distanceToStep: distToNextStep,
          remainingDistance: remainingMeters,
          remainingDuration,
        });

        // ── Voice: turn instructions ──
        const upcomingStep = steps[nextStepIdx];
        if (upcomingStep && nextStepIdx !== currentStepIdx) {
          for (const trig of VOICE_TRIGGERS) {
            const key = `${nextStepIdx}:${trig}`;
            if (lastVoiceFireRef.current[key]) continue;
            if (distToNextStep <= trig + 15 && distToNextStep >= trig - 15) {
              const phrase = distancePhrase(trig);
              voice.say(`${phrase}${cleanInstruction(upcomingStep.instruction)}`);
              lastVoiceFireRef.current[key] = true;
            }
          }
          if (distToNextStep < 35) {
            const key = `${nextStepIdx}:now`;
            if (!lastVoiceFireRef.current[key]) {
              voice.say(cleanInstruction(upcomingStep.instruction), { priority: 'high' });
              lastVoiceFireRef.current[key] = true;
            }
          }
        }

        // ── Voice: weather alerts ──
        const weather = useMapStore.getState().weather;
        if (weather?.samples?.length) {
          for (const s of weather.samples) {
            // Sample is "ahead of us" if its distFromStart is greater than what we've covered
            const ahead = s.distFromStart - distCoveredFromStart;
            if (ahead < 1500 || ahead > 6000) continue; // announce 1.5–6 km ahead
            if ((s.risk !== 'moderate' && s.risk !== 'severe')) continue;
            if (weatherAnnouncedRef.current.has(s.distFromStart)) continue;

            const km = Math.round(ahead / 1000);
            const cond = s.forecast?.condition || 'hazardous weather';
            const phrase =
              s.risk === 'severe'
                ? `Warning. ${cond} in about ${km} kilometers ahead. Drive with extra caution.`
                : `${cond} expected in about ${km} kilometers ahead.`;
            voice.say(phrase, { priority: 'high' });
            weatherAnnouncedRef.current.add(s.distFromStart);
            break; // one announcement per tick
          }
        }

        // ── Arrival ──
        const dest = { lat: coords[coords.length - 1][1], lng: coords[coords.length - 1][0] };
        if (distanceMeters(here, dest) < ARRIVAL_THRESHOLD) {
          voice.say('You have arrived at your destination.', { priority: 'high' });
          setNavProgress({ hasArrived: true });
          toast.success('🏁 You have arrived!');
          setTimeout(() => stopNavigation(), 4000);
        }
      },
      (err) => {
        console.error('GPS error:', err);
        toast.error('Lost GPS signal');
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      voice.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNavigating, activeRouteIdx]);
};

const computeStepSegmentIndices = (coords, steps) => {
  return steps.map((step) => {
    if (!step.location) return 0;
    const target = { lng: step.location[0], lat: step.location[1] };
    let bestIdx = 0, bestDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const pt = { lng: coords[i][0], lat: coords[i][1] };
      const d = distanceMeters(pt, target);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    return bestIdx;
  });
};

const handleReroute = async ({ here, destination, transportMode, avoidFeatures }) => {
  const { setRoutes } = useMapStore.getState();
  useMapStore.getState().setNavProgress({ offRoute: true });
  voice.say('Recalculating route', { priority: 'high' });
  try {
    if (!destination) return;
    const { data } = await apiComputeRoute({
      coordinates: [[here.lng, here.lat], [destination.lng, destination.lat]],
      mode: transportMode,
      alternatives: false,
      avoidFeatures,
    });
    if (data.data && data.data.length > 0) {
      setRoutes(data.data);
      toast.success('Route updated');
    }
  } catch (err) {
    console.error('Reroute failed:', err);
    toast.error('Could not recalculate route');
  }
};