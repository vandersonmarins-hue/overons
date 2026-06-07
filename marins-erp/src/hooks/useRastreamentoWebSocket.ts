'use client';

import { useState, useEffect, useRef } from 'react';
import { LocalizacaoMotorista } from '@/types/rastreamento';

interface UseRastreamentoWebSocketProps {
  pedidoId: string;
  pollingInterval?: number;
}

export function useRastreamentoWebSocket({ pedidoId, pollingInterval = 5000 }: UseRastreamentoWebSocketProps) {
  const [posicao, setPosicao] = useState<LocalizacaoMotorista | null>(null);
  const [status, setStatus] = useState<string>('');
  const [conectado, setConectado] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (!pedidoId) return;

    const buscarPosicao = async () => {
      try {
        const res = await fetch(`/api/rastreamento/${pedidoId}/posicao`);
        if (res.ok) {
          const data = await res.json();
          setPosicao(data);
          setConectado(true);
        }
      } catch { /* silent */ }
    };

    const buscarStatus = async () => {
      try {
        const res = await fetch(`/api/rastreamento/${pedidoId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
        }
      } catch { /* silent */ }
    };

    buscarPosicao();
    buscarStatus();
    intervalRef.current = setInterval(() => {
      buscarPosicao();
      buscarStatus();
    }, pollingInterval);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pedidoId, pollingInterval]);

  return { posicao, status, conectado };
}
