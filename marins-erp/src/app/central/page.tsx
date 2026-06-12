'use client';

import { useEffect, useState } from 'react';
import { Truck, MapPin, RefreshCw, Shield, LogOut } from 'lucide-react';
import Link from 'next/link';
import AcompanhamentoClientes from '@/components/central/AcompanhamentoClientes';
import MapaGoogle from '@/components/MapaGoogle';
import { clearCompanySession, getCompanySession, saveCompanySession, type CompanySession } from '@/lib/auth';

export default function CentralPage() {
  const [session, setSession] = useState<CompanySession | null>(null);
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [mensagemMotorista, setMensagemMotorista] = useState('');
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => { setSession(getCompanySession()); }, []);

  const entrar = async () => {
    if (!identificador.trim() || !senha.trim()) {
      setErro('Informe email/cnpj e senha');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/api/auth/company/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador, senha }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErro(data.error || 'Credenciais invalidas');
        return;
      }
      saveCompanySession(data);
      setSession(data);
      setErro('');
    } catch {
      setErro('Falha ao autenticar empresa');
    }
  };

  const load = async () => {
    try { const r = await fetch('http://localhost:3000/api/entregas'); if (r.ok) setData({ pedidos: await r.json(), resumo: { total: 0, emRota: 0, entregue: 0 } }); } catch {}
    setLoading(false);
  };

  const loadMessages = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/messages');
      if (response.ok) {
        setMessages(await response.json());
      }
    } catch {}
  };

  useEffect(() => {
    load();
    loadMessages();
    const id = setInterval(load, 15000);
    const msgId = setInterval(loadMessages, 5000);
    return () => {
      clearInterval(id);
      clearInterval(msgId);
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const stream = new EventSource('http://localhost:3000/api/entregas/stream');
    const refresh = () => { load(); };

    stream.addEventListener('delivery-created', refresh);
    stream.addEventListener('delivery-status-update', refresh);
    stream.addEventListener('delivery-location-update', refresh);

    stream.onerror = () => {
      stream.close();
    };

    return () => {
      stream.removeEventListener('delivery-created', refresh);
      stream.removeEventListener('delivery-status-update', refresh);
      stream.removeEventListener('delivery-location-update', refresh);
      stream.close();
    };
  }, [session]);

  const statusLabel: Record<string, string> = { pendente: '⏳ Aguardando', AGUARDANDO_CONFIRMACAO: '⏳ Aguardando', aceita: '✅ Aceita', em_andamento: '🚚 Em Rota', EM_SEPARACAO: '📦 Separação', SAIU_PARA_ENTREGA: '🚚 Em Rota', PROXIMO_CLIENTE: '📍 Próximo', concluida: '✅ Concluída', ENTREGUE: '✅ Entregue', recusada: '❌ Recusada', ausente: '🙍 Ausente', problema: '⚠️ Problema' };
  const statusIcon: Record<string, string> = { pendente: '⏳', AGUARDANDO_CONFIRMACAO: '⏳', aceita: '✅', em_andamento: '🚚', EM_SEPARACAO: '📦', SAIU_PARA_ENTREGA: '🚚', PROXIMO_CLIENTE: '📍', concluida: '✅', ENTREGUE: '✅', recusada: '❌', ausente: '🙍', problema: '⚠️' };
  const statusColor: Record<string, string> = { pendente: 'border-l-yellow-500', AGUARDANDO_CONFIRMACAO: 'border-l-yellow-500', aceita: 'border-l-green-500', em_andamento: 'border-l-blue-500', EM_SEPARACAO: 'border-l-yellow-500', SAIU_PARA_ENTREGA: 'border-l-blue-500', PROXIMO_CLIENTE: 'border-l-green-500', concluida: 'border-l-gray-500', ENTREGUE: 'border-l-gray-500', recusada: 'border-l-red-500', ausente: 'border-l-orange-500', problema: 'border-l-red-500' };

  const enviarMensagemMotorista = async () => {
    if (!selected?.entregadorId || !mensagemMotorista.trim()) return;
    setEnviandoMensagem(true);
    try {
      await fetch(`http://localhost:3000/api/entregas/${selected.pedidoId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'central',
          autor: 'Central',
          recipient: selected.entregadorNome || selected.entregadorId,
          message: mensagemMotorista.trim(),
        }),
      });
      await fetch('http://localhost:3000/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: selected.entregadorId,
          message: mensagemMotorista.trim(),
          empresa: 'Marins ERP',
        }),
      });
      setMensagemMotorista('');
    } catch {}
    setEnviandoMensagem(false);
  };

  const sair = () => {
    clearCompanySession();
    setSession(null);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900/80 rounded-2xl p-8 border border-white/10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-blue-400" />
          </div>
          <h1 className="text-white font-bold text-xl mb-2">Login da Empresa</h1>
          <p className="text-gray-400 text-sm mb-6">Acesse com email, CNPJ ou ID e senha</p>
          <input value={identificador} onChange={e => { setIdentificador(e.target.value); setErro(''); }}
            placeholder="Email ou CNPJ"
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 text-center mb-3 focus:outline-none focus:border-blue-500/50" />
          <input type="password" value={senha} onChange={e => { setSenha(e.target.value); setErro(''); }}
            onKeyDown={e => e.key === 'Enter' && entrar()}
            placeholder="Senha" autoFocus
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 text-center mb-4 focus:outline-none focus:border-blue-500/50" />
          {erro && <p className="text-red-400 text-sm mb-4">{erro}</p>}
          <button onClick={entrar} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">Acessar</button>
          <p className="text-gray-500 text-xs mt-4">Demo EMP_001: `overons2024`</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900/80 border-b border-white/10 px-5 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Truck size={20} className="text-blue-400" />
          <div>
            <h1 className="font-bold text-lg">Central</h1>
            <p className="text-xs text-gray-400">{session.user.nome}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={sair} className="bg-white/5 text-gray-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white/10 flex items-center gap-1">
            <LogOut size={14} /> Sair
          </button>
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
                { icon: '🚚', label: 'Em Andamento', value: data?.pedidos?.filter((p:any) => p.status === 'aceita' || p.status === 'em_andamento' || p.status === 'SAIU_PARA_ENTREGA' || p.status === 'PROXIMO_CLIENTE')?.length || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { icon: '✅', label: 'Concluidas', value: data?.pedidos?.filter((p:any) => p.status === 'concluida' || p.status === 'ENTREGUE')?.length || 0, color: 'text-green-400', bg: 'bg-green-500/10' },
              ].map(c => (
                <div key={c.label} className={`${c.bg} rounded-xl p-3 border border-white/10 text-center`}>
                  <div className={`text-lg ${c.color}`}>{c.icon}</div>
                  <div className="text-white font-bold text-xl">{c.value}</div>
                  <div className="text-gray-500 text-xs">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-4 border border-white/10 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-sm">🗺️ Monitoramento ao Vivo</h3>
                <span className="text-xs text-gray-500">
                  {data?.pedidos?.filter((pedido: any) => pedido.ultimaLatitude && pedido.ultimaLongitude).length || 0} motorista(s) com posição
                </span>
              </div>
              <div className="h-80 rounded-2xl overflow-hidden">
                <MapaGoogle
                  origemLat={-23.5505}
                  origemLng={-46.6333}
                  origemNome="Central"
                  destinos={(data?.pedidos || [])
                    .filter((pedido: any) => typeof pedido.destinoLat === 'number' && typeof pedido.destinoLng === 'number')
                    .map((pedido: any) => ({
                      id: pedido.pedidoId || pedido.id,
                      lat: pedido.destinoLat,
                      lng: pedido.destinoLng,
                      nome: pedido.cliente || pedido.clienteNome || pedido.pedidoId,
                      endereco: pedido.endereco || pedido.enderecoCompleto,
                      horario: pedido.tempoMin ? `${pedido.tempoMin} min` : '',
                    }))}
                  motoristas={(data?.pedidos || [])
                    .filter((pedido: any) => typeof pedido.ultimaLatitude === 'number' && typeof pedido.ultimaLongitude === 'number')
                    .map((pedido: any) => ({
                      id: pedido.entregadorId || pedido.pedidoId,
                      lat: pedido.ultimaLatitude,
                      lng: pedido.ultimaLongitude,
                      nome: pedido.entregadorNome || pedido.entregadorId || 'Motorista',
                    }))}
                  zoom={11}
                />
              </div>
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
                    {p.distanciaKm > 0 && <span>🚚 {Number(p.distanciaKm).toFixed(1)}km</span>}
                    {p.tempoMin > 0 && <span>⏱️ {p.tempoMin}min</span>}
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
                  <div className="text-white font-bold text-lg">{selected.distanciaKm ? Number(selected.distanciaKm).toFixed(1) : '—'} km</div>
                </div>
                <div className="bg-gray-800/80 rounded-xl p-3 text-center">
                  <div className="text-gray-400 text-xs">Previsão</div>
                  <div className="text-white font-bold text-lg">{selected.tempoMin || '—'} min</div>
                </div>
              </div>

              <div className="bg-gray-800/80 rounded-xl p-4">
                <div className="text-gray-400 text-xs mb-2">Status</div>
                <span className="text-sm font-bold px-3 py-1 rounded-full bg-blue-600/20 text-blue-400">
                  {statusLabel[selected.status] || selected.status || '📋 Pendente'}
                </span>
              </div>

              {selected.entregadorNome && (
                <div className="bg-gray-800/80 rounded-xl p-4">
                  <div className="text-gray-400 text-xs mb-1">Motorista</div>
                  <div className="text-white font-bold">{selected.entregadorNome}</div>
                  {selected.ultimaAtualizacaoLocalizacao && (
                    <div className="text-gray-500 text-xs mt-1">
                      Última posição: {new Date(selected.ultimaAtualizacaoLocalizacao).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              )}

              {selected.entregadorId && (
                <div className="bg-gray-800/80 rounded-xl p-4">
                  <div className="text-gray-400 text-xs mb-2">Mensagem para o motorista</div>
                  <textarea
                    value={mensagemMotorista}
                    onChange={(e) => setMensagemMotorista(e.target.value)}
                    rows={3}
                    placeholder="Digite uma orientação rápida para o motorista"
                    className="w-full bg-gray-900 border border-white/10 rounded-xl px-3 py-3 text-sm text-white placeholder-gray-600 focus:outline-none"
                  />
                  <button
                    onClick={enviarMensagemMotorista}
                    disabled={enviandoMensagem || !mensagemMotorista.trim()}
                    className="mt-3 w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-blue-700"
                  >
                    {enviandoMensagem ? 'Enviando...' : 'Enviar Mensagem'}
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                {selected.ultimaLatitude && selected.ultimaLongitude && (
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/search/${selected.ultimaLatitude},${selected.ultimaLongitude}`, '_blank')}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <MapPin size={16} /> Localização Atual
                  </button>
                )}
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
      <div className="max-w-7xl mx-auto px-5 pb-8">
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm">💬 Histórico de Mensagens</h3>
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
              {messages.length} registro{messages.length !== 1 ? 's' : ''}
            </span>
          </div>
          {messages.length === 0 ? (
            <div className="text-gray-500 text-sm">Nenhuma mensagem registrada.</div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className="bg-gray-800/60 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-white text-sm font-medium">
                      {message.nomeMotorista || message.driverId || 'Motorista'}
                    </div>
                    <div className={`text-xs font-bold ${message.readAt ? 'text-green-400' : 'text-yellow-400'}`}>
                      {message.readAt ? 'Lida' : 'Pendente'}
                    </div>
                  </div>
                  <div className="text-gray-200 text-sm">{message.message}</div>
                  <div className="text-gray-500 text-xs mt-2">
                    Enviada em {new Date(message.sentAt).toLocaleString('pt-BR')}
                    {message.readAt ? ` · Lida em ${new Date(message.readAt).toLocaleString('pt-BR')}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
