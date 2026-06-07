'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface LocationSharingState {
  ativo: boolean;
  intervalo: number;
  clientesAcompanhando: number;
}

export function useCompartilharLocalizacao(pedidoId?: string) {
  const [state, setState] = useState<LocationSharingState>({ ativo: true, intervalo: 10000, clientesAcompanhando: 0 });
  const watchRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const enviarLocalizacao = useCallback(async (lat: number, lng: number) => {
    try {
      const velocidade = lastPosRef.current ? calcularVelocidade(lastPosRef.current.lat, lastPosRef.current.lng, lat, lng, state.intervalo / 1000) : 0;
      lastPosRef.current = { lat, lng };
      const res = await fetch('/api/motorista/localizacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId: pedidoId || null,
          latitude: lat,
          longitude: lng,
          velocidade: Math.round(velocidade * 10) / 10,
          direcao: 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setState(prev => ({ ...prev, clientesAcompanhando: data.clientesAcompanhando || 0 }));
      }
    } catch {}
  }, [pedidoId, state.intervalo]);

  useEffect(() => {
    if (!state.ativo) return;

    if ('geolocation' in navigator) {
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          enviarLocalizacao(pos.coords.latitude, pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.ativo, enviarLocalizacao]);

  const pausar = () => setState(prev => ({ ...prev, ativo: false }));
  const retomar = () => setState(prev => ({ ...prev, ativo: true }));
  const alterarIntervalo = (ms: number) => setState(prev => ({ ...prev, intervalo: ms }));

  return { ...state, pausar, retomar, alterarIntervalo };
}

function calcularVelocidade(lat1: number, lng1: number, lat2: number, lng2: number, segundos: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  return segundos > 0 ? (km / segundos) * 3600 : 0;
}
