'use client';

import { useEffect, useState } from 'react';
import { Package, Truck, Clock, TrendingUp, MapPin, Phone, MessageSquare, Bell, RefreshCw } from 'lucide-react';

interface PedidoResumo {
  pedidoId: string;
  clienteNome: string;
  enderecoCompleto: string;
  status: string;
  tempoRestante: number;
  distanciaRestante: number;
}

const STATUS_CORES: Record<string, string> = {
  EM_SEPARACAO: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  SAIU_PARA_ENTREGA: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PROXIMO_CLIENTE: 'bg-green-500/20 text-green-400 border-green-500/30',
  ENTREGUE: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  EM_SEPARACAO: '📦 Separação',
  SAIU_PARA_ENTREGA: '🚚 Em Rota',
  PROXIMO_CLIENTE: '📍 Próximo',
  ENTREGUE: '✅ Entregue',
};

import Link from 'next/link';
import AcompanhamentoClientes from '@/components/central/AcompanhamentoClientes';

export default function CentralPage() {
  const [data, setData] = useState<any>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const r = await fetch('/api/central/rastreamento'); if (r.ok) setData(await r.json()); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900/80 border-b border-white/10 px-5 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 w-9 h-9 rounded-xl flex items-center justify-center"><Truck className="text-white" size={18} /></div>
          <h1 className="font-bold text-lg">Central de Monitoramento</h1>
        </div>
        <Link href="/central/clientes-list" className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 mr-2">Clientes</Link>
        <Link href="/central/analise-documentos" className="bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-yellow-700 mr-2">📋 Análise</Link>
        <Link href="/central/transportadores" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 mr-2">Transportadores</Link>
        <Link href="/central/nova-entrega" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 mr-2">+ Nova Entrega</Link>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 px-4 py-2 rounded-xl"><RefreshCw size={14} /> Atualizar</button>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-5">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { icon: '📦', label: 'Total', value: data?.resumo?.total || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { icon: '🚚', label: 'Em Rota', value: data?.resumo?.emRota || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { icon: '📍', label: 'Próximo', value: data?.resumo?.proximoCliente || 0, color: 'text-green-400', bg: 'bg-green-500/10' },
                { icon: '✅', label: 'Entregues', value: data?.resumo?.entregue || 0, color: 'text-green-400', bg: 'bg-green-500/10' },
              ].map(c => (
                <div key={c.label} className={'bg-gray-900/80 rounded-xl p-3 border border-white/10 text-center ' + c.bg}>
                  <div className={'text-lg ' + c.color}>{c.icon}</div>
                  <div className="text-white font-bold text-xl">{c.value}</div>
                  <div className="text-gray-500 text-xs">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data?.pedidos || []).map((p: any) => {
                const statusIcon: Record<string, string> = { EM_SEPARACAO: '📦', SAIU_PARA_ENTREGA: '🚚', PROXIMO_CLIENTE: '📍', ENTREGUE: '✅' };
                const statusColor: Record<string, string> = { EM_SEPARACAO: 'border-l-yellow-500', SAIU_PARA_ENTREGA: 'border-l-blue-500', PROXIMO_CLIENTE: 'border-l-green-500', ENTREGUE: 'border-l-gray-500' };
                return (
                  <div key={p.pedidoId || p.id} onClick={() => setSelectedDelivery(p)} className={'cursor-pointer hover:bg-gray-800/80 transition-colors bg-gray-900/80 rounded-xl p-4 border border-white/10 border-l-4 ' + (statusColor[p.status] || 'border-l-yellow-500')}>
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-white font-bold text-sm truncate">{p.clienteNome || p.cliente || '—'}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{statusIcon[p.status] || '📋'}</span>
                    </div>
                    <div className="text-gray-400 text-xs truncate mb-1">{p.enderecoCompleto || p.endereco || '—'}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      {p.distanciaRestante > 0 && <span>🚚 {p.distanciaRestante.toFixed(1)}km</span>}
                      {p.tempoRestante > 0 && <span>⏱️ {p.tempoRestante}min</span>}
                      <span className="text-gray-600">#{p.pedidoId}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
