import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

export default function useSocket() {
  const [connected, setConnected] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [deliveryLog, setDeliveryLog] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('drivers-update', (data) => setDrivers(data || []));
    socket.on('new-delivery-log', (data) => {
      setDeliveryLog(prev => [data, ...prev].slice(0, 50));
    });

    return () => socket.close();
  }, []);

  return { socket: socketRef.current, connected, drivers, deliveryLog };
}
