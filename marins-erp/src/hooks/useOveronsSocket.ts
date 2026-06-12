'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const OVERONS_SOCKET_URL = process.env.NEXT_PUBLIC_OVERONS_SOCKET_URL || 'http://localhost:3000';

export function useOveronsSocket(driverId?: string, driverName?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(OVERONS_SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (driverId) {
        socket.emit('driver-register', {
          driverId,
          nome: driverName || driverId,
          status: 'online',
        });
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [driverId, driverName]);

  useEffect(() => {
    if (!socketRef.current || !connected || !driverId) return;
    socketRef.current.emit('driver-register', {
      driverId,
      nome: driverName || driverId,
      status: 'online',
    });
  }, [connected, driverId, driverName]);

  return {
    socket: socketRef.current,
    connected,
  };
}
