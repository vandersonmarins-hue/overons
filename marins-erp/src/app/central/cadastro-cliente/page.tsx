'use client';

import { useState } from 'react';
import { Building2, User, Upload, ArrowLeft, CheckCircle, Copy } from 'lucide-react';
import Link from 'next/link';
import AutocompleteEndereco from '@/components/AutocompleteEndereco';

export default function CadastroClientePage() {
  const [tipo, setTipo] = useState<'fisica' | 'juridica'>('fisica');
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [docs, setDocs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const mascaraDoc = (val: string) => {
    const nums = val.replace(/\D/g, '');
    if (tipo === 'juridica') {
      return nums.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5').slice(0, 18);
    }
    return nums.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4').slice(0, 14);
  };

  const salvar = async () => {
    if (!nome || !documento) return;
    setSaving(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, nome, documento: documento.replace(/\D/g, ''), email, telefone, endereco, contatoNome, observacoes, documentos: docs }),
      });
      const data = await res.json();
      if (data.success) setResultado(data);
      else alert(data.erro || 'Erro ao cadastrar');
    } catch { alert('Erro ao cadastrar cliente'); }
    setSaving(false);
  };

  const addDoc = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = () => {
      if (input.files?.[0]) setDocs(prev => [...prev, input.files![0].name]);
    };
    input.click();
  };

  if (resultado) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900/80 rounded-2xl p-8 border border-white/10 max-w-md w-full text-center">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h1 className="text-white font-bold text-xl mb-2">Cliente Cadastrado!</h1>
          <p className="text-gray-400 text-sm mb-6">{tipo === 'juridica' ? '🏢' : '👤'} {nome}</p>
          <div className="flex gap-3">
            <Link href="/central" className="flex-1 bg-white/10 text-white py-3 rounded-xl text-sm font-medium hover:bg-white/20 text-center">
              Voltar
            </Link>
            <button onClick={() => { setResultado(null); setNome(''); setDocumento(''); setEmail(''); setTelefone(''); setEndereco(''); setContatoNome(''); setObservacoes(''); setDocs([]); }}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700">
              Novo Cliente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900/80 border-b border-white/10 px-5 py-3 flex items-center gap-3">
        <Link href="/central" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></Link>
        <span className="text-blue-400"><Building2 size={20} /></span>
        <h1 className="text-white font-bold text-lg">Cadastro de Cliente</h1>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {/* Tipo */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <h2 className="text-white font-bold text-sm mb-4">Tipo de Cliente</h2>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setTipo('fisica')}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${tipo === 'fisica' ? 'bg-blue-600/20 border-blue-500/50' : 'bg-gray-800 border-white/10 hover:bg-gray-700'}`}>
              <User size={24} className={tipo === 'fisica' ? 'text-blue-400' : 'text-gray-500'} />
              <div><div className="text-white font-bold text-sm">Pessoa Fisica</div><div className="text-gray-500 text-xs">CPF</div></div>
            </button>
            <button onClick={() => setTipo('juridica')}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${tipo === 'juridica' ? 'bg-blue-600/20 border-blue-500/50' : 'bg-gray-800 border-white/10 hover:bg-gray-700'}`}>
              <Building2 size={24} className={tipo === 'juridica' ? 'text-blue-400' : 'text-gray-500'} />
              <div><div className="text-white font-bold text-sm">Pessoa Juridica</div><div className="text-gray-500 text-xs">CNPJ</div></div>
            </button>
          </div>
        </div>

        {/* Dados */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <h2 className="text-white font-bold text-sm mb-4">{tipo === 'juridica' ? '🏢 Dados da Empresa' : '👤 Dados Pessoais'}</h2>

          <input value={nome} onChange={e => setNome(e.target.value)} placeholder={tipo === 'juridica' ? 'Razao Social' : 'Nome completo'}
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 mb-3 focus:outline-none focus:border-blue-500/50" />

          <input value={documento} onChange={e => setDocumento(mascaraDoc(e.target.value))} placeholder={tipo === 'juridica' ? 'CNPJ' : 'CPF'} maxLength={tipo === 'juridica' ? 18 : 14}
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 mb-3 focus:outline-none focus:border-blue-500/50" />

          <div className="grid grid-cols-2 gap-3 mb-3">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Telefone"
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
          </div>

          <AutocompleteEndereco value={endereco} onChange={setEndereco} placeholder="Endereco" className="mb-3" />

          {tipo === 'juridica' && (
            <input value={contatoNome} onChange={e => setContatoNome(e.target.value)} placeholder="Nome do contato na empresa"
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 mb-3 focus:outline-none focus:border-blue-500/50" />
          )}

          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observacoes" rows={2}
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
        </div>

        {/* Documentos */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <h2 className="text-white font-bold text-sm mb-4">📎 Documentos Anexados</h2>
          {docs.length === 0 ? (
            <p className="text-gray-500 text-sm mb-3">Nenhum documento anexado</p>
          ) : (
            <div className="space-y-1 mb-3">
              {docs.map((d, i) => (
                <div key={i} className="text-sm text-gray-300 flex items-center gap-2"><Upload size={14} className="text-blue-400" /> {d}</div>
              ))}
            </div>
          )}
          <button onClick={addDoc} className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-sm text-gray-400 hover:border-blue-500/50 hover:text-blue-400 flex items-center justify-center gap-2">
            <Upload size={16} /> Anexar Documento
          </button>
        </div>

        {/* Salvar */}
        <button onClick={salvar} disabled={saving || !nome || !documento}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl text-base font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-lg shadow-blue-900/30 active:scale-[0.99] transition-all">
          {saving ? 'Cadastrando...' : `${tipo === 'juridica' ? '🏢' : '👤'} Cadastrar Cliente`}
        </button>
      </main>
    </div>
  );
}
