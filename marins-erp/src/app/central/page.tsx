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

export default function CentralPage() {
  const [data, setData] = useState<any>(null);
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
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 px-4 py-2 rounded-xl"><RefreshCw size={14} /> Atualizar</button>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-5">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando...</div>
        ) : (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
              {[
                { icon: Package, label: 'Total', value: data?.resumo?.total || 0, color: 'text-blue-400' },
                { icon: Truck, label: 'Em Rota', value: data?.resumo?.emRota || 0, color: 'text-blue-400' },
                { icon: MapPin, label: 'Próximo', value: data?.resumo?.proximoCliente || 0, color: 'text-green-400' },
                { icon: Clock, label: 'Médio', value: `${data?.resumo?.tempoMedio || 0}min`, color: 'text-purple-400' },
                { icon: TrendingUp, label: 'Entregues', value: data?.resumo?.entregue || 0, color: 'text-green-400' },
              ].map(c => (
                <div key={c.label} className="bg-gray-900/80 rounded-xl p-4 border border-white/10">
                  <c.icon size={18} className={c.color} />
                  <div className="text-2xl font-bold mt-1">{c.value}</div>
                  <div className="text-xs text-gray-500">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Lista de entregas */}
            <div className="bg-gray-900/80 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-bold">📋 Entregas do Dia</h2>
                <span className="text-xs text-gray-500">{data?.pedidos?.length || 0} pedidos</span>
              </div>
              <div className="divide-y divide-white/5">
                {(data?.pedidos || []).map((p: PedidoResumo) => (
                  <div key={p.pedidoId} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-sm">{p.clienteNome}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.enderecoCompleto}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CORES[p.status] || ''}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>🚚 {p.distanciaRestante?.toFixed(1)} km</span>
                      <span>⏱️ {p.tempoRestante} min</span>
                      <span className="text-gray-600">#{p.pedidoId}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg hover:bg-blue-600/30">📍 Rota</button>
                      <button className="text-xs bg-green-600/20 text-green-400 px-3 py-1 rounded-lg hover:bg-green-600/30"><Phone size={12} className="inline" /> Cliente</button>
                      <button className="text-xs bg-red-600/20 text-red-400 px-3 py-1 rounded-lg hover:bg-red-600/30">Cancelar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
