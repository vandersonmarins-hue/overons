'use client';

import { useEffect, useState } from 'react';
import { Shield, FileText, ClipboardList, DollarSign, Truck, TrendingUp, CalendarDays } from 'lucide-react';

export default function CompanyReportsPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entregas, setEntregas] = useState<any[]>([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isMaster = typeof window !== 'undefined' && localStorage.getItem('overons_master') === 'true';
    setAutenticado(isMaster);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:3000/api/entregas')
      .then(r => r.json())
      .then(d => setEntregas(d || []))
      .finally(() => setLoading(false));
  }, [period]);

  const entrar = () => {
    if (senha === 'overons2024') {
      localStorage.setItem('overons_master', 'true');
      setAutenticado(true);
      setErro('');
    } else {
      setErro('Senha incorreta');
    }
  };

  // Calcula metricas
  const total = entregas.length;
  const pendentes = entregas.filter(e => e.status === 'pendente' || e.status === 'AGUARDANDO_CONFIRMACAO').length;
  const andamento = entregas.filter(e => e.status === 'aceita' || e.status === 'em_andamento' || e.status === 'SAIU_PARA_ENTREGA').length;
  const concluidas = entregas.filter(e => e.status === 'concluida' || e.status === 'ENTREGUE').length;
  const recusadas = entregas.filter(e => e.status === 'recusada').length;
  const receitaTotal = entregas.reduce((acc, e) => acc + (e.precoViagem || 0), 0);
  const mediaKm = entregas.filter(e => e.distanciaKm).length > 0
    ? entregas.filter(e => e.distanciaKm).reduce((acc, e) => acc + (e.distanciaKm || 0), 0) / entregas.filter(e => e.distanciaKm).length
    : 0;

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900/80 rounded-2xl p-8 border border-white/10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-blue-400" />
          </div>
          <h1 className="text-white font-bold text-xl mb-2">Acesso Restrito</h1>
          <p className="text-gray-400 text-sm mb-6">Área restrita à empresa</p>
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

  const Card = ({ titulo, valor, icon, cor }: any) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">{titulo}</span>
        <span className={cor || 'text-blue-500'}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{valor}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
            <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
            <p className="text-sm text-gray-500">Visão geral das operações</p>
          </div>
        </div>

        {/* Period */}
        <div className="flex items-center gap-2 mb-6">
          <CalendarDays size={16} className="text-gray-400" />
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="week">📅 Última semana</option>
            <option value="month">📅 Último mês</option>
            <option value="year">📅 Último ano</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm animate-pulse">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3" />
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-12" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card titulo="Total Entregas" valor={total} icon={<Truck size={18} />} cor="text-blue-500" />
              <Card titulo="Pendentes" valor={pendentes} icon={<ClipboardList size={18} />} cor="text-yellow-500" />
              <Card titulo="Em Andamento" valor={andamento} icon={<Truck size={18} />} cor="text-blue-500" />
              <Card titulo="Concluídas" valor={concluidas} icon={<TrendingUp size={18} />} cor="text-green-500" />
              <Card titulo="Recusadas" valor={recusadas} icon={<Shield size={18} />} cor="text-red-500" />
              {receitaTotal > 0 && (
                <Card titulo="Receita Total" valor={`R$ ${receitaTotal.toFixed(2)}`} icon={<DollarSign size={18} />} cor="text-green-500" />
              )}
              <Card titulo="Média KM" valor={mediaKm > 0 ? `${mediaKm.toFixed(1)} km` : '—'} icon={<Truck size={18} />} cor="text-purple-500" />
            </div>

            {/* Tabela de entregas recentes */}
            {entregas.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white">📦 Entregas Recentes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                        <th className="text-left px-5 py-3 font-medium">Pedido</th>
                        <th className="text-left px-5 py-3 font-medium">Cliente</th>
                        <th className="text-left px-5 py-3 font-medium">Status</th>
                        <th className="text-left px-5 py-3 font-medium">Valor</th>
                        <th className="text-left px-5 py-3 font-medium">Distância</th>
                        <th className="text-left px-5 py-3 font-medium">Criação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entregas.slice(0, 20).map((e) => (
                        <tr key={e.pedidoId || e.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-5 py-3 font-medium text-gray-900 dark:text-white text-xs">{e.pedidoId || e.id}</td>
                          <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{e.cliente}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                              e.status === 'concluida' || e.status === 'ENTREGUE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              e.status === 'recusada' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              e.status === 'aceita' || e.status === 'SAIU_PARA_ENTREGA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {e.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                            {e.precoViagem ? `R$ ${e.precoViagem.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {e.distanciaKm ? `${e.distanciaKm.toFixed(1)} km` : '—'}
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs">
                            {e.criadaEm ? new Date(e.criadaEm).toLocaleDateString('pt-BR') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Vazio */}
            {entregas.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma entrega encontrada</p>
                <p className="text-sm mt-1">Crie uma entrega na Central para começar</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
