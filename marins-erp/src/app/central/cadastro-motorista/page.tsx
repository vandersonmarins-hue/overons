'use client';

import { useState } from 'react';
import { Truck, Upload, ArrowLeft, CheckCircle, Camera, FileText } from 'lucide-react';
import Link from 'next/link';

export default function CadastroMotoristaPage() {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnh, setCnh] = useState('');
  const [cnhCategoria, setCnhCategoria] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [docs, setDocs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const mascaraCPF = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    return nums.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
  };

  const salvar = async () => {
    if (!nome || !cpf) return;
    setSaving(true);
    try {
      const res = await fetch('/api/motoristas-cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cpf, cnh, cnhCategoria, telefone, email, endereco, dataNascimento, observacoes, documentos: docs }),
      });
      const data = await res.json();
      if (data.success) setResultado(data);
      else alert(data.erro || 'Erro ao cadastrar');
    } catch { alert('Erro ao cadastrar motorista'); }
    setSaving(false);
  };

  const addDoc = (tipo: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = () => { if (input.files?.[0]) setDocs(prev => [...prev, `${tipo}: ${input.files![0].name}`]); };
    input.click();
  };

  if (resultado) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900/80 rounded-2xl p-8 border border-white/10 max-w-md w-full text-center">
          <Truck size={48} className="text-blue-400 mx-auto mb-4" />
          <h1 className="text-white font-bold text-xl mb-2">Motorista Cadastrado!</h1>
          <p className="text-gray-400 text-sm mb-2">{nome}</p>
          <p className="text-gray-600 text-xs mb-6">ID: {resultado.id}</p>
          <div className="flex gap-3">
            <Link href="/central" className="flex-1 bg-white/10 text-white py-3 rounded-xl text-sm font-medium hover:bg-white/20 text-center">Voltar</Link>
            <button onClick={() => { setResultado(null); setNome(''); setCpf(''); setCnh(''); setTelefone(''); setEmail(''); setEndereco(''); setDocs([]); }}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700">Novo Motorista</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900/80 border-b border-white/10 px-5 py-3 flex items-center gap-3">
        <Link href="/central" className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></Link>
        <Truck size={20} className="text-blue-400" />
        <h1 className="text-white font-bold text-lg">Cadastro de Motorista</h1>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {/* Dados Pessoais */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <h2 className="text-white font-bold text-sm mb-4">👤 Dados Pessoais</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" className="col-span-2 w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            <input value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} placeholder="CPF" maxLength={14} className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            <input value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} type="date" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Telefone" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
          </div>
          <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Endereco" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 mb-3 focus:outline-none focus:border-blue-500/50" />
        </div>

        {/* CNH */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <h2 className="text-white font-bold text-sm mb-4">🚛 Habilitação</h2>
          <div className="grid grid-cols-3 gap-3">
            <input value={cnh} onChange={e => setCnh(e.target.value)} placeholder="Numero CNH" className="col-span-2 w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            <select value={cnhCategoria} onChange={e => setCnhCategoria(e.target.value)} className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50">
              <option value="">Categoria</option>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option><option value="AB">AB</option>
            </select>
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <h2 className="text-white font-bold text-sm mb-4">📎 Documentos</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => addDoc('CNH')} className="py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-center gap-2"><Camera size={16} /> CNH</button>
            <button onClick={() => addDoc('RG')} className="py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-center gap-2"><FileText size={16} /> RG</button>
            <button onClick={() => addDoc('CPF')} className="py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-center gap-2"><FileText size={16} /> CPF</button>
            <button onClick={() => addDoc('Comprovante')} className="py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-center gap-2"><Upload size={16} /> Comprovante</button>
          </div>
          {docs.map((d, i) => (
            <div key={i} className="text-sm text-gray-400 flex items-center gap-2 py-1"><Upload size={14} className="text-blue-400" /> {d}</div>
          ))}
        </div>

        <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observacoes" rows={2}
          className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />

        <button onClick={salvar} disabled={saving || !nome || !cpf}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl text-base font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 shadow-lg shadow-blue-900/30 active:scale-[0.99] transition-all">
          {saving ? 'Cadastrando...' : '🚚 Cadastrar Motorista'}
        </button>
      </main>
    </div>
  );
}
