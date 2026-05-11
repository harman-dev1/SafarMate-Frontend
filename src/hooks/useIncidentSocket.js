import { useEffect, useRef } from 'react';
import { io as ioClient } from 'socket.io-client';
import { useIncidentStore } from '@/store/incidentStore';
import { useMapStore } from '@/store/mapStore';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useIncidentSocket = () => {
  const { addIncident, updateIncident, removeIncident } = useIncidentStore();
  const { userLocation } = useMapStore();
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = ioClient(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 socket connected', socket.id);
    });

    socket.on('incident:new', (incident) => {
      addIncident(incident);
      const label = incident.type.charAt(0).toUpperCase() + incident.type.slice(1);
      toast(`📍 ${label} reported nearby`, { duration: 4000 });
    });

    socket.on('incident:update', (incident) => {
      updateIncident(incident);
    });

    socket.on('incident:removed', ({ id }) => {
      removeIncident(id);
    });

    return () => socket.disconnect();
  }, [addIncident, updateIncident, removeIncident]);

  // Send our location to server when it changes so it knows what to broadcast to us
  useEffect(() => {
    if (!socketRef.current || !userLocation) return;
    socketRef.current.emit('user:location', {
      lat: userLocation.lat,
      lng: userLocation.lng,
    });
  }, [userLocation]);
};