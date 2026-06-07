'use client';

import { useEffect, useState } from 'react';
import { Package, Truck, MapPin, Clock, TrendingUp, RefreshCw, X, ExternalLink, Lock, Shield } from 'lucide-react';
import Link from 'next/link';
import AcompanhamentoClientes from '@/components/central/AcompanhamentoClientes';
import { loginMaster, logoutMaster, isMaster, getPermissoes } from '@/lib/permissoes';

export default function CentralPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { setAutenticado(isMaster()); }, []);

  const entrar = () => {
    if (loginMaster(senha)) { setAutenticado(true); setErro(''); }
    else { setErro('Senha incorreta'); }
  };

  const load = async () => {
    try { const r = await fetch('http://localhost:3000/api/entregas'); if (r.ok) setData({ pedidos: await r.json(), resumo: { total: 0, emRota: 0, entregue: 0 } }); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, []);

  const statusLabel: Record<string, string> = { pendente: '⏳ Aguardando', AGUARDANDO_CONFIRMACAO: '⏳ Aguardando', aceita: '✅ Aceita', EM_SEPARACAO: '📦 Separação', SAIU_PARA_ENTREGA: '🚚 Em Rota', PROXIMO_CLIENTE: '📍 Próximo', concluida: '✅ Concluída', ENTREGUE: '✅ Entregue', recusada: '❌ Recusada' };
  const statusIcon: Record<string, string> = { pendente: '⏳', AGUARDANDO_CONFIRMACAO: '⏳', aceita: '✅', EM_SEPARACAO: '📦', SAIU_PARA_ENTREGA: '🚚', PROXIMO_CLIENTE: '📍', concluida: '✅', ENTREGUE: '✅', recusada: '❌' };
  const statusColor: Record<string, string> = { pendente: 'border-l-yellow-500', AGUARDANDO_CONFIRMACAO: 'border-l-yellow-500', aceita: 'border-l-green-500', EM_SEPARACAO: 'border-l-yellow-500', SAIU_PARA_ENTREGA: 'border-l-blue-500', PROXIMO_CLIENTE: 'border-l-green-500', concluida: 'border-l-gray-500', ENTREGUE: 'border-l-gray-500', recusada: 'border-l-red-500' };

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900/80 rounded-2xl p-8 border border-white/10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-blue-400" />
          </div>
          <h1 className="text-white font-bold text-xl mb-2">Acesso Restrito</h1>
          <p className="text-gray-400 text-sm mb-6">Esta área é apenas para a empresa</p>
          <input type="password" value={senha} onChange={e => { setSenha(e.target.value); setErro(''); }}
            onKeyDown={e => e.key === 'Enter' && entrar()}
            placeholder="Senha mestra" autoFocus
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 text-center mb-4 focus:outline-none focus:border-blue-500/50" />
          {erro && <p className="text-red-400 text-sm mb-4">{erro}</p>}
          <button onClick={entrar} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">Acessar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900/80 border-b border-white/10 px-5 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Truck size={20} className="text-blue-400" />
          <h1 className="font-bold text-lg">Central</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/central/clientes-list" className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-green-700">👥 Clientes</Link>
          <Link href="/central/transportadores" className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700">🚚 Transportadores</Link>
          <Link href="/central/analise-documentos" className="bg-yellow-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-yellow-700">📋 Análise</Link>
          <Link href="/central/nova-entrega" className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700">+ Nova</Link>
          <button onClick={load} className="px-3 py-2 rounded-xl text-xs bg-white/5 text-gray-400 hover:text-white"><RefreshCw size={14} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-5">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Carregando...</div>
        ) : (
          <>
            {/* Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { icon: '📦', label: 'Total', value: data?.pedidos?.length || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { icon: '⏳', label: 'Pendentes', value: data?.pedidos?.filter((p:any) => p.status === 'pendente' || p.status === 'AGUARDANDO_CONFIRMACAO')?.length || 0, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                { icon: '🚚', label: 'Em Andamento', value: data?.pedidos?.filter((p:any) => p.status === 'aceita' || p.status === 'SAIU_PARA_ENTREGA' || p.status === 'PROXIMO_CLIENTE')?.length || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { icon: '✅', label: 'Concluidas', value: data?.pedidos?.filter((p:any) => p.status === 'concluida' || p.status === 'ENTREGUE')?.length || 0, color: 'text-green-400', bg: 'bg-green-500/10' },
              ].map(c => (
                <div key={c.label} className={`${c.bg} rounded-xl p-3 border border-white/10 text-center`}>
                  <div className={`text-lg ${c.color}`}>{c.icon}</div>
                  <div className="text-white font-bold text-xl">{c.value}</div>
                  <div className="text-gray-500 text-xs">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Grid entregas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data?.pedidos || []).map((p: any) => (
                <div key={p.pedidoId || p.id} onClick={() => setSelected(p)}
                  className={'cursor-pointer hover:bg-gray-800/80 transition-colors bg-gray-900/80 rounded-xl p-4 border border-white/10 border-l-4 ' + (statusColor[p.status] || 'border-l-yellow-500')}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-white font-bold text-sm truncate">{p.cliente || p.clienteNome || '—'}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{statusIcon[p.status] || '📋'}</span>
                  </div>
                  <div className="text-gray-400 text-xs truncate mb-1">{p.endereco || p.enderecoCompleto || '—'}</div>
                  <div className="flex gap-2 text-xs text-gray-500">
                    {p.distanciaRestante > 0 && <span>🚚 {p.distanciaRestante.toFixed(1)}km</span>}
                    {p.tempoRestante > 0 && <span>⏱️ {p.tempoRestante}min</span>}
                    <span className="text-gray-600">#{p.pedidoId}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-white/10 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">📦 Detalhes</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800/80 rounded-xl p-4">
                <div className="text-gray-400 text-xs mb-1">Cliente</div>
                <div className="text-white font-bold">{selected.cliente || selected.clienteNome || '—'}</div>
                <div className="text-gray-400 text-xs mt-2 mb-1">Endereço</div>
                <div className="text-white text-sm">{selected.endereco || selected.enderecoCompleto || '—'}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/80 rounded-xl p-3 text-center">
                  <div className="text-gray-400 text-xs">Distância</div>
                  <div className="text-white font-bold text-lg">{selected.distanciaRestante?.toFixed(1) || '—'} km</div>
                </div>
                <div className="bg-gray-800/80 rounded-xl p-3 text-center">
                  <div className="text-gray-400 text-xs">Previsão</div>
                  <div className="text-white font-bold text-lg">{selected.tempoRestante || '—'} min</div>
                </div>
              </div>

              <div className="bg-gray-800/80 rounded-xl p-4">
                <div className="text-gray-400 text-xs mb-2">Status</div>
                <span className="text-sm font-bold px-3 py-1 rounded-full bg-blue-600/20 text-blue-400">
                  {statusLabel[selected.status] || selected.status || '📋 Pendente'}
                </span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => window.open('https://www.google.com/maps/search/' + encodeURIComponent(selected.enderecoCompleto || selected.endereco || ''), '_blank')}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
                  <MapPin size={16} /> Ver no Maps
                </button>
                <button onClick={() => setSelected(null)} className="flex-1 bg-gray-800 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-700">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-5 pb-8"><AcompanhamentoClientes /></div>
    </div>
  );
}
