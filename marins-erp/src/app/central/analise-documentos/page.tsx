'use client';

import { useEffect, useState } from 'react';
import { Truck, CheckCircle, XCircle, Search, FileText, AlertTriangle, Loader } from 'lucide-react';
import Link from 'next/link';

const VEICULO_LABEL: Record<string, string> = { moto: '🏍️ Moto', carro: '🚗 Carro', fiorino: '🚐 Fiorino', van: '🚐 Van', truck: '🚛 Truck', caminhao: '🚛 Caminhão' };

export default function AnaliseDocumentosPage() {
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [motivo, setMotivo] = useState('');
  const [processando, setProcessando] = useState(false);

  const load = () => {
    fetch('/api/motoristas-cadastro')
      .then(r => r.json())
      .then(d => setMotoristas(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, []);

  const pendentes = motoristas.filter(m => m.status === 'pendente');
  const aprovados = motoristas.filter(m => m.status === 'aprovado');
  const recusados = motoristas.filter(m => m.status === 'recusado');

  const aprovar = async () => {
    setProcessando(true);
    try {
      await fetch('/api/analise', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motoristaId: selected.id, acao: 'aprovar' }),
      });
      setSelected(null);
      load();
    } catch {}
    setProcessando(false);
  };

  const recusar = async () => {
    if (!motivo.trim()) return alert('Informe o motivo da recusa');
    setProcessando(true);
    try {
      await fetch('/api/analise', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motoristaId: selected.id, acao: 'recusar', motivo: motivo.trim() }),
      });
      setSelected(null);
      setMotivo('');
      load();
    } catch {}
    setProcessando(false);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900/80 border-b border-white/10 px-5 py-3 flex items-center gap-3">
        <Link href="/central" className="text-gray-400 hover:text-white"><span>←</span></Link>
        <FileText size={20} className="text-blue-400" />
        <h1 className="text-white font-bold text-lg">Análise de Documentos</h1>
        <span className="text-yellow-400 text-sm bg-yellow-500/10 px-3 py-1 rounded-full">{pendentes.length} pendentes</span>
      </header>

      {selected ? (
        <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
          <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
            <h2 className="text-white font-bold text-sm mb-4">👤 Dados</h2>
            {[
              { label: 'Nome', value: selected.nome },
              { label: 'CPF', value: selected.cpf },
              { label: 'Telefone', value: selected.telefone },
              { label: 'Email', value: selected.email },
              { label: 'CNH', value: selected.cnh },
              { label: 'Categoria', value: selected.cnhCategoria },
              { label: 'Veículo', value: VEICULO_LABEL[selected.tipoVeiculo] || selected.tipoVeiculo },
            ].map(d => d.value ? (
              <div key={d.label} className="flex justify-between py-2 border-b border-white/5"><span className="text-gray-400 text-sm">{d.label}</span><span className="text-white text-sm font-medium">{d.value}</span></div>
            ) : null)}
          </div>

          <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
            <h2 className="text-white font-bold text-sm mb-4">📎 Documentos Anexados</h2>
            {selected.documentos?.length > 0 ? selected.documentos.map((doc: string, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-gray-800/80 rounded-xl p-3 border border-white/5 mb-2">
                <FileText size={18} className="text-blue-400" />
                <span className="text-sm text-gray-200 flex-1">{doc}</span>
                <button className="text-blue-400 text-xs hover:text-blue-300">Visualizar</button>
              </div>
            )) : <p className="text-gray-500 text-sm">Nenhum documento</p>}
          </div>

          <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
            <h2 className="text-white font-bold text-sm mb-4">📋 Decisão</h2>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Motivo da recusa (obrigatório se for recusar)" rows={3}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 mb-4 focus:outline-none focus:border-blue-500/50" />
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 py-3 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700">Voltar</button>
              <button onClick={recusar} disabled={processando} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {processando ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />} Recusar
              </button>
              <button onClick={aprovar} disabled={processando} className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {processando ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />} Aprovar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-5 py-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20 text-center"><div className="text-yellow-400 text-2xl font-bold">{pendentes.length}</div><div className="text-gray-400 text-xs">Pendentes</div></div>
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20 text-center"><div className="text-green-400 text-2xl font-bold">{aprovados.length}</div><div className="text-gray-400 text-xs">Aprovados</div></div>
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 text-center"><div className="text-red-400 text-2xl font-bold">{recusados.length}</div><div className="text-gray-400 text-xs">Recusados</div></div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500">Carregando...</div>
          ) : pendentes.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Nenhum cadastro pendente de análise</div>
          ) : (
            <div className="space-y-2">
              {pendentes.map(m => (
                <div key={m.id} onClick={() => setSelected(m)}
                  className="bg-gray-900/80 rounded-xl p-4 border border-yellow-500/20 hover:bg-gray-800/80 cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-white font-bold">{m.nome}</div>
                      <div className="text-gray-400 text-sm mt-1">
                        {VEICULO_LABEL[m.tipoVeiculo] || '—'} · {m.cpf || '—'} · {m.telefone || '—'}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        📄 {m.documentos?.length || 0} documentos · 📋 {m.certidoes ? Object.keys(m.certidoes).length : 0} certidões
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full font-bold">PENDENTE</span>
                      <span className="text-gray-500">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
