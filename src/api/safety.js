import api from './axios';

export const apiSafetyAlongRoute = ({ coordinates, bufferMeters = 400 }) =>
  api.post('/safety/along-route', { coordinates, bufferMeters });

export const apiSafetySegmentsInBbox = ({ minLng, minLat, maxLng, maxLat }) =>
  api.get('/safety/segments', { params: { minLng, minLat, maxLng, maxLat } });
