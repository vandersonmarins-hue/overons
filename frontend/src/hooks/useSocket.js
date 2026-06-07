import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

// Socket criado fora do componente (sincrono)
const globalSocket = io(SOCKET_URL, { autoConnect: true });

export default function useSocket() {
  const [connected, setConnected] = useState(globalSocket.connected);
  const [drivers, setDrivers] = useState([]);
  const [deliveryLog, setDeliveryLog] = useState([]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onDrivers = (data) => setDrivers(data || []);
    const onDelivery = (data) => {
      setDeliveryLog(prev => [data, ...prev].slice(0, 50));
    };

    globalSocket.on('connect', onConnect);
    globalSocket.on('disconnect', onDisconnect);
    globalSocket.on('drivers-update', onDrivers);
    globalSocket.on('new-delivery-log', onDelivery);

    return () => {
      globalSocket.off('connect', onConnect);
      globalSocket.off('disconnect', onDisconnect);
      globalSocket.off('drivers-update', onDrivers);
      globalSocket.off('new-delivery-log', onDelivery);
    };
  }, []);

  return { socket: globalSocket, connected, drivers, deliveryLog };
}
