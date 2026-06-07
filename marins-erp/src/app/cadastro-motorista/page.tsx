'use client';

import { useState } from 'react';
import { Truck, Upload, CheckCircle, ArrowLeft, Bike, Car, FileText, Camera, Loader } from 'lucide-react';

export default function CadastroMotoristaPublicoPage() {
  const [passo, setPasso] = useState(1);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cnh, setCnh] = useState('');
  const [cnhCategoria, setCnhCategoria] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [tipoContrato, setTipoContrato] = useState('autonomo');
  const [docs, setDocs] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const VEICULOS = [
    { v: 'moto', l: '🏍️ Moto' }, { v: 'carro', l: '🚗 Carro' }, { v: 'fiorino', l: '🚐 Fiorino' },
    { v: 'van', l: '🚐 Van' }, { v: 'truck', l: '🚛 Truck' }, { v: 'caminhao', l: '🚛 Caminhão' },
  ];

  const mascaraCPF = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    return nums.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
  };

  const addDoc = (nome: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = () => { if (input.files?.[0]) setDocs(prev => [...prev, `${nome}: ${input.files![0].name}`]); };
    input.click();
  };

  const salvar = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/motoristas-cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cpf, dataNascimento, telefone, email, endereco, cnh, cnhCategoria, tipoVeiculo, tipoContrato, documentos: docs, observacoes }),
      });
      const data = await res.json();
      setResultado(data);
    } catch { alert('Erro ao enviar cadastro'); }
    setSaving(false);
  };

  if (resultado) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <h1 className="text-white font-bold text-2xl mb-2">Cadastro Enviado!</h1>
          <p className="text-gray-400 mb-6">Seu cadastro foi recebido e está em análise. Você receberá um retorno em breve.</p>
          <div className="bg-gray-800/80 rounded-2xl p-5 border border-white/10 mb-6">
            <div className="text-gray-400 text-xs mb-1">Protocolo</div>
            <div className="text-white font-bold text-lg">{resultado.id}</div>
          </div>
          <p className="text-gray-500 text-sm">Acompanhe seu email para saber o resultado da análise.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600/20 to-transparent px-6 pt-8 pb-6 text-center">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/30">
          <Truck className="text-white" size={32} />
        </div>
        <h1 className="text-white font-bold text-2xl">Seja um Transportador</h1>
        <p className="text-gray-400 text-sm mt-1">Cadastre-se para receber entregas</p>
      </div>

      {/* Progresso */}
      <div className="flex items-center justify-center gap-2 px-6 py-4">
        {[1, 2, 3].map(p => (
          <div key={p} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${passo >= p ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>{p}</div>
            {p < 3 && <div className={`w-8 h-0.5 ${passo > p ? 'bg-blue-600' : 'bg-gray-800'}`} />}
          </div>
        ))}
      </div>

      <div className="px-6 pb-8 space-y-4">
        {passo === 1 && (
          <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
            <h2 className="text-white font-bold text-base mb-4">👤 Dados Pessoais</h2>
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
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 mb-3 focus:outline-none focus:border-blue-500/50" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={cpf} onChange={e => setCpf(mascaraCPF(e.target.value))} placeholder="CPF" maxLength={14} className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
              <input value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} type="date" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Telefone / WhatsApp" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
            </div>
            <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Endereço" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
          </div>
        )}

        {passo === 2 && (
          <>
            <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
              <h2 className="text-white font-bold text-base mb-4">🚛 Habilitação</h2>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <input value={cnh} onChange={e => setCnh(e.target.value)} placeholder="CNH" className="col-span-2 bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                <select value={cnhCategoria} onChange={e => setCnhCategoria(e.target.value)} className="bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50">
                  <option value="">Cat.</option>
                  <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                  <option value="D">D</option><option value="E">E</option><option value="AB">AB</option>
                </select>
              </div>
              <h3 className="text-gray-300 text-sm font-medium mb-3">Tipo de Veículo</h3>
              <div className="grid grid-cols-3 gap-2">
                {VEICULOS.map(t => (
                  <button key={t.v} onClick={() => setTipoVeiculo(t.v)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all ${tipoVeiculo === t.v ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-gray-800 border-white/10 text-gray-400 hover:bg-gray-700'}`}>
                    {t.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
              <h2 className="text-white font-bold text-base mb-4">📎 Documentos</h2>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => addDoc('CNH')} className="py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 flex items-center justify-center gap-2"><Camera size={16} /> CNH</button>
                <button onClick={() => addDoc('RG')} className="py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 flex items-center justify-center gap-2"><FileText size={16} /> RG</button>
                <button onClick={() => addDoc('CPF')} className="py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 flex items-center justify-center gap-2"><FileText size={16} /> CPF</button>
                <button onClick={() => addDoc('Comprovante')} className="py-3 bg-gray-800 border border-white/10 rounded-xl text-sm text-gray-300 flex items-center justify-center gap-2"><Upload size={16} /> Endereço</button>
              </div>
              {docs.map((d, i) => (
                <div key={i} className="text-sm text-gray-400 py-1 flex items-center gap-2"><Upload size={14} className="text-green-400" /> {d}</div>
              ))}
            </div>
          </>
        )}

        {passo === 3 && (
          <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
            <h2 className="text-white font-bold text-base mb-4">✅ Revisão</h2>
            <div className="space-y-3">
              {[
                { label: 'Nome', value: nome },
                { label: 'CPF', value: cpf },
                { label: 'Telefone', value: telefone },
                { label: 'Email', value: email },
                { label: 'CNH', value: cnh },
                { label: 'Veículo', value: VEICULOS.find(t => t.v === tipoVeiculo)?.l },
              ].map(d => d.value ? (
                <div key={d.label} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">{d.label}</span>
                  <span className="text-white text-sm font-medium">{d.value}</span>
                </div>
              ) : null)}
              <div className="flex justify-between py-2">
                <span className="text-gray-400 text-sm">Documentos</span>
                <span className="text-green-400 text-sm font-medium">{docs.length} anexados</span>
              </div>
            </div>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observações (opcional)" rows={2}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 mt-4 focus:outline-none focus:border-blue-500/50" />
          </div>
        )}

        {/* Botoes */}
        <div className="flex gap-3">
          {passo > 1 && <button onClick={() => setPasso(p => p - 1)} className="flex-1 py-3.5 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700">Voltar</button>}
          {passo < 3 ? (
            <button onClick={() => setPasso(p => p + 1)} disabled={passo === 1 && (!nome || !cpf)} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
              Próximo
            </button>
          ) : (
            <button onClick={salvar} disabled={saving}
              className="flex-1 py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-bold hover:from-green-600 hover:to-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader size={18} className="animate-spin" /> : null}
              {saving ? 'Enviando...' : '✅ Enviar para Análise'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
