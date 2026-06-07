'use client';

import { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import type { RastreamentoPedido } from '@/types/rastreamento';
import { STATUS_LABELS } from '@/types/rastreamento';
import { useRastreamentoWebSocket } from '@/hooks/useRastreamentoWebSocket';
import MapaRastreamento from '@/components/rastreamento/MapaRastreamento';
import StatusTimeline from '@/components/rastreamento/StatusTimeline';
import InformacoesPedido from '@/components/rastreamento/InformacoesPedido';
import ContatoEntregador from '@/components/rastreamento/ContatoEntregador';
import ConfirmacaoRecebimento from '@/components/rastreamento/ConfirmacaoRecebimento';

export default function RastreamentoPage(props: { params: Promise<{ pedidoId: string }> }) {
  const [pedido, setPedido] = useState<RastreamentoPedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandInfo, setExpandInfo] = useState(false);
  const [pedidoId, setPedidoId] = useState('');

  useEffect(() => {
    (async () => {
      const p = await props.params;
      setPedidoId(p.pedidoId);
      try { const res = await fetch(`/api/rastreamento/${p.pedidoId}`); if (res.ok) setPedido(await res.json()); } catch {}
      setLoading(false);
    })();
  }, []);

  const { posicao } = useRastreamentoWebSocket({ pedidoId });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
        <div className="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full mb-4" />
        <p className="text-gray-400 text-sm">Buscando informações do pedido...</p>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-white font-bold text-xl mb-2">Pedido não encontrado</h1>
        <p className="text-gray-400 text-sm text-center">Verifique o código de rastreamento.</p>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[pedido.status] || { label: 'Desconhecido', icon: '📋', color: 'text-gray-400' };
  const previsto = new Date(pedido.previsaoChegada);
  const minutosRestantes = Math.max(0, Math.floor((previsto.getTime() - Date.now()) / 60000));

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* HEADER */}
      <div className="bg-gradient-to-b from-blue-600/20 to-transparent px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-gray-400 text-xs mb-0.5">Rastreamento</div>
            <h1 className="text-white font-bold text-lg">{pedido.pedidoId}</h1>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusInfo.color} bg-white/5 border-white/10`}>
            {statusInfo.icon} {statusInfo.label}
          </div>
        </div>
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600/20 flex items-center justify-center">
            <Clock size={28} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-gray-400 text-xs">Previsão de Chegada</div>
            <div className="text-white font-bold text-2xl">{minutosRestantes > 0 ? `${minutosRestantes} min` : 'Chegando!'}</div>
            <div className="text-gray-500 text-xs">{pedido.distanciaRestante.toFixed(1)} km · {previsto.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <button onClick={() => fetch(`/api/rastreamento/${pedidoId}/notificar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tipo: 'chegada' }) })}
            className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all">
            <Bell size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* MAPA */}
      <div className="px-5 mb-3 h-56">
        <MapaRastreamento
          motoristaLat={posicao?.latitude}
          motoristaLng={posicao?.longitude}
          destinoLat={pedido.enderecoLat}
          destinoLng={pedido.enderecoLng}
          motoristaNome={pedido.motorista?.nome || 'Motorista'}
        />
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">
        {pedido.motorista && <ContatoEntregador motoristaNome={pedido.motorista.nome} motoristaTelefone={pedido.motorista.telefone} />}

        {pedido.status === 'PROXIMO_CLIENTE' && <ConfirmacaoRecebimento pedidoId={pedidoId} onConfirmado={() => {}} />}
        {pedido.status === 'ENTREGUE' && (
          <div className="bg-green-600/10 rounded-xl p-5 border border-green-500/20 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-white font-bold">Entrega Realizada!</div>
            <div className="text-gray-400 text-sm mt-1">Seu pedido foi entregue com sucesso.</div>
          </div>
        )}

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-bold text-sm mb-4">📌 Histórico</h3>
          <StatusTimeline historico={pedido.historico} statusAtual={pedido.status} />
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <button onClick={() => setExpandInfo(!expandInfo)}
            className="w-full flex items-center justify-between p-5 text-white font-bold text-sm hover:bg-white/5 transition-colors">
            <span>📋 Detalhes do Pedido</span>
            {expandInfo ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          {expandInfo && (
            <div className="px-5 pb-5">
              <InformacoesPedido produtos={pedido.produtos} clienteNome={pedido.clienteNome} enderecoCompleto={pedido.enderecoCompleto} pedidoId={pedido.pedidoId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
