'use client';

import { useState } from 'react';
import { Package, Key, ArrowRight, AlertCircle, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AcessoClientePage() {
  const [chave, setChave] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const acessar = async () => {
    if (!chave.trim()) { setErro('Digite sua chave de acesso'); return; }
    setLoading(true);
    setErro('');
    
    try {
      const res = await fetch('/api/acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave: chave.trim() }),
      });
      const data = await res.json();
      
      if (data.valida) {
        // Salva chave no sessionStorage para usar nas chamadas
        sessionStorage.setItem('chave_acesso', chave.trim().toUpperCase());
        sessionStorage.setItem('cliente_nome', data.cliente);
        router.push(`/rastreamento/${data.pedidoId}?chave=${chave.trim().toUpperCase()}`);
      } else {
        setErro(data.erro || 'Chave invalida');
      }
    } catch {
      setErro('Erro ao validar chave. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/30">
        <Truck className="text-white" size={32} />
      </div>

      <h1 className="text-white font-bold text-2xl mb-1 text-center">Acompanhe sua Entrega</h1>
      <p className="text-gray-500 text-sm mb-8 text-center">Digite a chave de acesso recebida no WhatsApp ou SMS</p>

      {/* Card de login */}
      <div className="w-full max-w-sm bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
            <Key size={20} className="text-blue-400" />
          </div>
          <div>
            <div className="text-white text-sm font-bold">Chave de Acesso</div>
            <div className="text-gray-500 text-xs">Ex: MAR-2024-001</div>
          </div>
        </div>

        <input
          value={chave}
          onChange={e => { setChave(e.target.value); setErro(''); }}
          onKeyDown={e => e.key === 'Enter' && acessar()}
          placeholder="Digite sua chave"
          className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3.5 text-white text-base font-medium placeholder-gray-600 focus:outline-none focus:border-blue-500/50 mb-4 text-center tracking-widest uppercase"
          autoFocus
          maxLength={20}
        />

        {erro && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <button
          onClick={acessar}
          disabled={loading || !chave.trim()}
          className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-base font-bold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
        >
          {loading ? 'Validando...' : 'Acessar Rastreamento'}
          {!loading && <ArrowRight size={18} />}
        </button>
      </div>

      {/* Ajuda */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-xs">
          Nao recebeu sua chave? Entre em contato com a central.<br />
          <span className="text-blue-500 hover:text-blue-400 cursor-pointer" onClick={() => window.open('https://wa.me/5511999999999', '_blank')}>
            Fale conosco no WhatsApp
          </span>
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center">
        <p className="text-gray-700 text-xs">Marins ERP - Sistema de Rastreamento</p>
      </div>
    </div>
  );
}
