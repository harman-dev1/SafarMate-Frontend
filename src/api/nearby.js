import api from './axios';

export const apiGetNearby = ({ lat, lng, category, radius = 5000 }) =>
  api.get('/nearby', { params: { lat, lng, category, radius } });