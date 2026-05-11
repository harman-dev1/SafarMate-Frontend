import api from './axios';

export const apiComputeRoute = ({
  coordinates,
  mode = 'driving',
  alternatives = true,
  avoidFeatures = [],
  avoidPolygons = null,
}) =>
  api.post('/routes/compute', {
    coordinates,
    mode,
    alternatives,
    avoidFeatures,
    avoidPolygons,
  });