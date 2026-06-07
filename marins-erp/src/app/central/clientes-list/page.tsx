'use client';

import { useEffect, useState } from 'react';
import { Building2, User, Search, Eye, FileText, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function ClientesListPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch('/api/clientes')
      .then(r => r.json())
      .then(d => setClientes(d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = clientes.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.documento?.includes(search) ||
    c.telefone?.includes(search)
  );

  if (selected) {
    return (
      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900/80 border-b border-white/10 px-5 py-3 flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
          {selected.tipo === 'juridica' ? <Building2 size={20} className="text-green-400" /> : <User size={20} className="text-blue-400" />}
          <h1 className="text-white font-bold text-lg">{selected.nome}</h1>
        </header>
        <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">
          <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
            <h2 className="text-white font-bold text-sm mb-4">👤 Dados</h2>
            {[
              { label: 'Tipo', value: selected.tipo === 'juridica' ? 'Pessoa Juridica' : 'Pessoa Fisica' },
              { label: selected.tipo === 'juridica' ? 'CNPJ' : 'CPF', value: selected.documento },
              { label: 'Email', value: selected.email },
              { label: 'Telefone', value: selected.telefone },
              { label: 'Endereco', value: selected.endereco },
              { label: 'Contato', value: selected.contatoNome },
            ].map(d => d.value ? (
              <div key={d.label} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-gray-400 text-sm">{d.label}</span>
                <span className="text-white text-sm font-medium">{d.value}</span>
              </div>
            ) : null)}
          </div>

          {selected.documentos?.length > 0 && (
            <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
              <h2 className="text-white font-bold text-sm mb-4">📎 Documentos</h2>
              {selected.documentos.map((doc: string, i: number) => (
                <div key={i} className="flex items-center justify-between bg-gray-800/80 rounded-xl p-3 border border-white/5 mb-2">
                  <div className="flex items-center gap-3"><FileText size={18} className="text-blue-400" /><span className="text-sm text-gray-200">{doc}</span></div>
                  <button onClick={() => alert('📄 Documento: ' + doc + '\n\n(Pré-visualização disponível em breve)')} className="text-blue-400 text-sm">👁️ Visualizar</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setSelected(null)} className="w-full py-3 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20">Voltar</button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900/80 border-b border-white/10 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 size={20} className="text-green-400" />
          <h1 className="text-white font-bold text-lg">Clientes</h1>
          <span className="text-gray-500 text-sm">({clientes.length})</span>
        </div>
        <Link href="/central/cadastro-cliente" className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700">+ Novo</Link>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-4">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, documento ou telefone..."
            className="w-full bg-gray-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Nenhum cliente encontrado</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} onClick={() => setSelected(c)}
                className="bg-gray-900/80 rounded-xl p-4 border border-white/10 hover:bg-gray-800/80 cursor-pointer transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.tipo === 'juridica' ? 'bg-green-600/20' : 'bg-blue-600/20'}`}>
                      {c.tipo === 'juridica' ? <Building2 size={20} className="text-green-400" /> : <User size={20} className="text-blue-400" />}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{c.nome}</div>
                      <div className="text-gray-500 text-xs">{c.tipo === 'juridica' ? 'CNPJ' : 'CPF'}: {c.documento}</div>
                    </div>
                  </div>
                  <Eye size={16} className="text-gray-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
