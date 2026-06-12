'use client';

import { useState, useEffect } from 'react';
import { Clock, ChevronDown, ChevronUp, Bell, AlertTriangle, Send } from 'lucide-react';
import type { RastreamentoPedido } from '@/types/rastreamento';
import { STATUS_LABELS } from '@/types/rastreamento';
import { useRastreamentoWebSocket } from '@/hooks/useRastreamentoWebSocket';
import MapaRastreamento from '@/components/rastreamento/MapaRastreamento';
import StatusTimeline from '@/components/rastreamento/StatusTimeline';
import InformacoesPedido from '@/components/rastreamento/InformacoesPedido';
import ContatoEntregador from '@/components/rastreamento/ContatoEntregador';
import ConfirmacaoRecebimento from '@/components/rastreamento/ConfirmacaoRecebimento';

interface DeliveryMessage {
  id: string;
  pedidoId: string;
  sender: 'central' | 'client' | 'driver';
  autor: string;
  recipient?: string | null;
  message: string;
  sentAt: string;
}

export default function RastreamentoPage(props: { params: Promise<{ pedidoId: string }>; searchParams: Promise<{ chave?: string }> }) {
  const [pedido, setPedido] = useState<RastreamentoPedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandInfo, setExpandInfo] = useState(false);
  const [pedidoId, setPedidoId] = useState('');
  const [acessoNegado, setAcessoNegado] = useState(false);
  const [messages, setMessages] = useState<DeliveryMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await props.params;
      const sp = await props.searchParams;
      setPedidoId(p.pedidoId);

      // Valida chave de acesso
      const chave = sp.chave || sessionStorage.getItem('chave_acesso');
      if (!chave) { setAcessoNegado(true); setLoading(false); return; }
      const valRes = await fetch('/api/acesso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chave }) });
      const valData = await valRes.json();
      if (!valData.valida) { setAcessoNegado(true); setLoading(false); return; }

      try { const res = await fetch(`/api/rastreamento/${p.pedidoId}`); if (res.ok) setPedido(await res.json()); } catch {}
      setLoading(false);
    })();
  }, []);

  const { posicao } = useRastreamentoWebSocket({ pedidoId });

  useEffect(() => {
    if (!pedidoId) return;

    const loadMessages = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/entregas/${pedidoId}/messages`);
        if (response.ok) {
          setMessages(await response.json());
        }
      } catch {}
    };

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [pedidoId]);

  const sendMessage = async () => {
    if (!pedidoId || !messageText.trim()) return;
    setSendingMessage(true);
    try {
      const clienteNome = typeof window !== 'undefined' ? sessionStorage.getItem('cliente_nome') || 'Cliente' : 'Cliente';
      await fetch(`http://localhost:3000/api/entregas/${pedidoId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'client',
          autor: clienteNome,
          recipient: pedido?.motorista?.nome || 'Central',
          message: messageText.trim(),
        }),
      });
      setMessageText('');
      const response = await fetch(`http://localhost:3000/api/entregas/${pedidoId}/messages`);
      if (response.ok) {
        setMessages(await response.json());
      }
    } catch {}
    setSendingMessage(false);
  };

  if (acessoNegado) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-red-600/20 flex items-center justify-center mb-4">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h1 className="text-white font-bold text-xl mb-2">Acesso Negado</h1>
        <p className="text-gray-400 text-sm text-center mb-6">Chave de acesso invalida ou expirada.</p>
        <a href="/acesso-cliente"
          className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
          Tentar novamente
        </a>
      </div>
    );
  }

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

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-bold text-sm mb-4">💬 Conversa da Entrega</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-sm">Nenhuma mensagem nesta entrega.</div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    message.sender === 'client'
                      ? 'bg-blue-600 text-white ml-8'
                      : 'bg-gray-800 text-gray-200 mr-8 border border-white/10'
                  }`}
                >
                  <div className="text-xs opacity-70 mb-1">{message.autor}</div>
                  <div>{message.message}</div>
                  <div className="text-[11px] opacity-60 mt-1 text-right">
                    {new Date(message.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Enviar mensagem sobre sua entrega"
              className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            />
            <button
              onClick={sendMessage}
              disabled={sendingMessage || !messageText.trim()}
              className="bg-blue-600 text-white px-4 rounded-xl font-bold disabled:opacity-50 hover:bg-blue-700"
            >
              <Send size={18} />
            </button>
          </div>
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
