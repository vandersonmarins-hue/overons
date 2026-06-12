'use client';

import { useEffect, useState } from 'react';
import { Shield, FileText } from 'lucide-react';
import Link from 'next/link';
import { loginMaster, isMaster } from '@/lib/permissoes';

export default function CompanyReportsPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('month');
  const [driver, setDriver] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { setAutenticado(isMaster()); }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/motorista/reports?period=${period}&driver=${driver}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period, driver]);

  const entrar = () => {
    if (loginMaster(senha)) {
      setAutenticado(true);
      setErro('');
    } else {
      setErro('Senha incorreta');
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText size={24} className="text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="bg-white dark:bg-gray-800 border rounded-xl px-4 py-2 text-sm">
            <option value="week">Semana</option>
            <option value="month">Mês</option>
            <option value="year">Ano</option>
          </select>
          <select value={driver} onChange={e => setDriver(e.target.value)}
            className="bg-white dark:bg-gray-800 border rounded-xl px-4 py-2 text-sm">
            <option value="all">Todos motoristas</option>
          </select>
        </div>

        {loading && <p className="text-gray-500">Carregando...</p>}
        {!loading && data && (
          <pre className="text-sm text-gray-700 dark:text-gray-300">{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
