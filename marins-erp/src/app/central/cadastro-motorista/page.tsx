'use client';

import { useState } from 'react';
import { Truck, Upload, ArrowLeft, CheckCircle, Camera, FileText, Bike, Car, Truck as TruckIcon } from 'lucide-react';
import Link from 'next/link';
import AutocompleteEndereco from '@/components/AutocompleteEndereco';

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
  const [tipoVeiculo, setTipoVeiculo] = useState("");
  const [docs, setDocs] = useState<string[]>([]);
  const [certidoes, setCertidoes] = useState<Record<string,boolean>>({});
  const [tipoContrato, setTipoContrato] = useState("autonomo");
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
        body: JSON.stringify({ nome, cpf, cnh, cnhCategoria, tipoVeiculo, tipoContrato, telefone, email, endereco, dataNascimento, observacoes, documentos: docs }),
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
          {resultado.senhaInicial && (
            <div className="bg-blue-600/10 rounded-2xl p-4 border border-blue-500/20 mb-6 text-left">
              <p className="text-blue-300 text-xs mb-1">Senha inicial</p>
              <p className="text-white font-bold text-base">{resultado.senhaInicial}</p>
            </div>
          )}
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
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button onClick={() => setTipoContrato("clt")}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${tipoContrato === "clt" ? "bg-blue-600/20 border-blue-500/50 text-blue-400" : "bg-gray-800 border-white/10 text-gray-400 hover:bg-gray-700"}`}>
              👔 CLT (Funcionário)
            </button>
            <button onClick={() => setTipoContrato("autonomo")}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${tipoContrato === "autonomo" ? "bg-blue-600/20 border-blue-500/50 text-blue-400" : "bg-gray-800 border-white/10 text-gray-400 hover:bg-gray-700"}`}>
              🚚 Autônomo
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" className="col-span-2 w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            <input value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} placeholder="CPF" maxLength={14} className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            <input value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} type="date" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Telefone" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
          </div>
          <AutocompleteEndereco value={endereco} onChange={setEndereco} placeholder="Endereco" className="mb-3" />
        </div>

        {/* CNH */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <h2 className="text-white font-bold text-sm mb-4">🚛 Habilitação e Veículo</h2>
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">Tipo de Veículo que dirige</label>
            <div className="grid grid-cols-3 gap-2">
              {[{v:"moto",icon:Bike,l:"Moto"},{v:"carro",icon:Car,l:"Carro"},{v:"fiorino",icon:Truck,l:"Fiorino"},{v:"van",icon:Truck,l:"Van"},{v:"truck",icon:TruckIcon,l:"Truck"},{v:"caminhao",icon:TruckIcon,l:"Caminhão"}].map(t => (
                <button key={t.v} onClick={() => setTipoVeiculo(t.v)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${tipoVeiculo === t.v ? "bg-blue-600/20 border-blue-500/50 text-blue-400" : "bg-gray-800 border-white/10 text-gray-400 hover:bg-gray-700"}`}>
                  <t.icon size={24} />
                  <span className="text-xs">{t.l}</span>
                </button>
              ))}
            </div>
          </div>
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

                {/* Certidoes e Exames */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <h2 className="text-white font-bold text-sm mb-4">📋 Certidões e Exames</h2>
          <div className="space-y-3">
            {[
              {id:"aso",label:"ASO - Atestado de Saúde Ocupacional"},
              {id:"toxicologico",label:"Exame Toxicológico"},
              {id:"mopp",label:"MOPP - Produtos Perigosos"},
              {id:"defensiva",label:"Direção Defensiva"},
              {id:"carga",label:"Transporte de Cargas"},
              {id:"antecedentes",label:"Antecedentes Criminais"},
              {id:"cnhDigital",label:"CNH Digital"},
              {id:"treinamento",label:"Certificado de Treinamento"},
            ].map(cert => (
              <div key={cert.id} className="flex items-center justify-between bg-gray-800/80 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!certidoes[cert.id]} onChange={() => setCertidoes(prev => ({...prev, [cert.id]: !prev[cert.id]}))}
                    className="w-5 h-5 rounded-lg text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-200">{cert.label}</span>
                </div>
                <button onClick={() => addDoc(cert.label)} className="text-blue-400 text-xs hover:text-blue-300 flex items-center gap-1">
                  <Upload size={12} /> Anexar
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-yellow-300 text-xs">⚠️ O motorista só poderá aceitar entregas se todas as certidões obrigatórias estiverem anexadas.</p>
          </div>
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
