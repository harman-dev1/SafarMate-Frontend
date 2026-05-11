import api from './axios';

export const apiReportIncident = (payload) =>
  api.post('/incidents', payload);

export const apiGetIncidentsInBbox = ({ minLng, minLat, maxLng, maxLat }) =>
  api.get('/incidents', { params: { minLng, minLat, maxLng, maxLat } });

export const apiGetIncidentsNearRoute = ({ coordinates, bufferMeters = 500 }) =>
  api.post('/incidents/near-route', { coordinates, bufferMeters });

export const apiVerifyIncident = ({ id, action, userLat, userLng }) =>
  api.post(`/incidents/${id}/verify`, { action, userLat, userLng });

export const apiRemoveIncident = (id) =>
  api.delete(`/incidents/${id}`);