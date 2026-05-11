import api from './axios';
export const apiAutocomplete = (q, { lat, lng, limit = 8 } = {}) =>
  api.get('/search/autocomplete', { params: { q, lat, lng, limit } });
export const apiReverseGeocode = (lat, lng) =>
  api.get('/search/reverse', { params: { lat, lng } });