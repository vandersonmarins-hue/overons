'use client';

import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
}

export function useGeolocationTracker() {
  const [posicao, setPosicao] = useState<GeolocationState>({
    latitude: null, longitude: null, accuracy: null, error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosicao(prev => ({ ...prev, error: 'Geolocalização não suportada' }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setPosicao({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        error: null,
      }),
      (err) => setPosicao(prev => ({ ...prev, error: err.message })),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return posicao;
}
