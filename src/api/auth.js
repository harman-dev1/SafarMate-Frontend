import api from './axios';
export const apiGoogleLogin = (idToken) => api.post('/auth/google', { idToken });
export const apiMe = () => api.get('/auth/me');
export const apiLogout = () => api.post('/auth/logout');