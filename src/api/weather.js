import api from './axios';

export const apiWeatherAlongRoute = ({
  coordinates,
  totalDistance,
  totalDuration,
  departAt,
}) =>
  api.post('/weather/along-route', {
    coordinates,
    totalDistance,
    totalDuration,
    departAt,
  });