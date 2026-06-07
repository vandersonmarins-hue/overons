'use client';

import { useEffect, useState } from 'react';
import { Truck, Search, Eye, FileText, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const VEICULO_ICON = { moto: '🏍️', carro: '🚗', fiorino: '🚐', van: '🚐', truck: '🚛', caminhao: '🚛' };
const TIPO_CONTRATO: Record<string,string> = { clt: '👔 CLT', autonomo: '🚚 Autonomo' };
const VEICULO_LABEL = { moto: 'Moto', carro: 'Carro', fiorino: 'Fiorino', van: 'Van', truck: 'Truck', caminhao: 'Caminhão' };

export default function TransportadoresPage() {
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch('/api/motoristas-cadastro')
      .then(r => r.json())
      .then(d => setMotoristas(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = motoristas.filter(m =>
    m.nome?.toLowerCase().includes(search.toLowerCase()) ||
    m.cpf?.includes(search) ||
    m.telefone?.includes(search)
  );

  // Modal de detalhes
  if (selected) {
    const docs = [
      { label: 'CNH', value: selected.cnh },
      { label: 'Categoria', value: selected.cnhCategoria },
      { label: 'Tipo Veículo', value: VEICULO_LABEL[selected.tipoVeiculo] || selected.tipoVeiculo },
      { label: 'CPF', value: selected.cpf },
      { label: 'Telefone', value: selected.telefone },
      { label: 'Email', value: selected.email },
      { label: 'Data Nascimento', value: selected.dataNascimento },
    ];

    return (
      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900/80 border-b border-white/10 px-5 py-3 flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
          <Truck size={20} className="text-blue-400" />
          <h1 className="text-white font-bold text-lg">{selected.nome}</h1>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">
          <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
            <h2 className="text-white font-bold text-sm mb-4">👤 Dados</h2>
            {docs.map(d => d.value ? (
              <div key={d.label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-gray-400 text-sm">{d.label}</span>
                <span className="text-white text-sm font-medium">{d.value}</span>
              </div>
            ) : null)}
          </div>

          {/* Documentos Anexados */}
          <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
            <h2 className="text-white font-bold text-sm mb-4">📎 Documentos Anexados</h2>
            {selected.documentos?.length > 0 ? selected.documentos.map((doc: string, i: number) => (
              <div key={i} className="flex items-center justify-between bg-gray-800/80 rounded-xl p-3 border border-white/5 mb-2">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-blue-400" />
                  <span className="text-sm text-gray-200">{doc}</span>
                </div>
                <button onClick={() => alert('📄 Documento: ' + doc + '\n\n(Pré-visualização disponível em breve)')} className="text-blue-400 text-sm hover:text-blue-300">👁️ Visualizar</button>
              </div>
            )) : <p className="text-gray-500 text-sm">Nenhum documento anexado</p>}
          </div>

          <button onClick={() => setSelected(null)} className="w-full py-3 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20">Voltar</button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900/80 border-b border-white/10 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck size={20} className="text-blue-400" />
          <h1 className="text-white font-bold text-lg">Transportadores</h1>
          <span className="text-gray-500 text-sm">({motoristas.length})</span>
        </div>
        <Link href="/central/cadastro-motorista" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">+ Novo</Link>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-4">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, CPF ou telefone..."
            className="w-full bg-gray-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Nenhum motorista encontrado</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(m => (
              <div key={m.id} onClick={() => setSelected(m)}
                className="bg-gray-900/80 rounded-xl p-4 border border-white/10 hover:bg-gray-800/80 cursor-pointer transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {m.nome?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{m.nome}</div>
                      <div className="text-gray-500 text-xs">
                        {TIPO_CONTRATO[m.tipoContrato] || '🚚'} · {VEICULO_ICON[m.tipoVeiculo] || '🚚'} {VEICULO_LABEL[m.tipoVeiculo] || m.tipoVeiculo || '—'} · {m.cpf || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.documentos?.length > 0 && <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full">{m.documentos.length} docs</span>}
                    <Eye size={16} className="text-gray-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
