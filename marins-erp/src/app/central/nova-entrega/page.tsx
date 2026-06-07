'use client';

import { useState } from 'react';
import { Package, Plus, Trash2, Copy, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NovaEntregaPage() {
  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [produtos, setProdutos] = useState([{ nome: '', quantidade: 1, preco: 0 }]);
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<{ pedidoId: string; chaveAcesso: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const addProduto = () => setProdutos([...produtos, { nome: '', quantidade: 1, preco: 0 }]);

  const removeProduto = (idx: number) => {
    if (produtos.length <= 1) return;
    setProdutos(produtos.filter((_, i) => i !== idx));
  };

  const updateProduto = (idx: number, field: string, value: any) => {
    const updated = [...produtos];
    (updated[idx] as any)[field] = value;
    setProdutos(updated);
  };

  const salvar = async () => {
    if (!cliente.trim() || !endereco.trim()) return alert('Preencha cliente e endereco');
    setSaving(true);
    try {
      const res = await fetch('http://localhost:3000/api/entregas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: cliente.trim(),
          endereco: endereco.trim(),
          observacoes: observacoes.trim(),
          produtos: produtos.filter(p => p.nome.trim()),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResultado({ pedidoId: data.pedidoId, chaveAcesso: data.chaveAcesso });
      } else {
        alert(data.erro || 'Erro ao cadastrar');
      }
    } catch {
      alert('Erro ao cadastrar entrega');
    }
    setSaving(false);
  };

  const copiarChave = () => {
    if (resultado) {
      navigator.clipboard.writeText(resultado.chaveAcesso);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  if (resultado) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900/80 rounded-2xl p-8 border border-white/10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-400" />
          </div>
          <h1 className="text-white font-bold text-xl mb-2">Entrega Cadastrada!</h1>
          <p className="text-gray-400 text-sm mb-6">Os dados foram registrados com sucesso.</p>

          <div className="bg-gray-800/80 rounded-xl p-4 mb-4 text-left">
            <div className="text-gray-400 text-xs mb-1">Pedido</div>
            <div className="text-white font-bold text-lg">{resultado.pedidoId}</div>
          </div>

          <div className="bg-blue-600/10 rounded-xl p-4 mb-6 border border-blue-500/20">
            <div className="text-gray-300 text-xs mb-2">Chave de Acesso do Cliente</div>
            <div className="text-white font-bold text-2xl tracking-wider mb-3">{resultado.chaveAcesso}</div>
            <button onClick={copiarChave}
              className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              {copiado ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copiado ? 'Copiado!' : 'Copiar Chave'}
            </button>
          </div>

          <div className="flex gap-3">
            <Link href="/central" className="flex-1 bg-white/10 text-white py-3 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors text-center">
              Voltar
            </Link>
            <button onClick={() => { setResultado(null); setCliente(''); setEndereco(''); setProdutos([{ nome: '', quantidade: 1, preco: 0 }]); setObservacoes(''); }}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
              Nova Entrega
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
        <Package size={20} className="text-blue-400" />
        <h1 className="text-white font-bold text-lg">Nova Entrega</h1>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {/* Dados do Cliente */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <h2 className="text-white font-bold text-sm mb-4">👤 Dados do Cliente</h2>
          <input value={cliente} onChange={e => setCliente(e.target.value)}
            placeholder="Nome do cliente" className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 mb-3 focus:outline-none focus:border-blue-500/50" />
          <textarea value={endereco} onChange={e => setEndereco(e.target.value)}
            placeholder="Endereco completo da entrega" rows={2}
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 mb-3 focus:outline-none focus:border-blue-500/50" />
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
            placeholder="Observacoes (opcional)" rows={2}
            className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
        </div>

        {/* Produtos */}
        <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm">📦 Produtos</h2>
            <button onClick={addProduto} className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300">
              <Plus size={14} /> Adicionar
            </button>
          </div>
          <div className="space-y-3">
            {produtos.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={p.nome} onChange={e => updateProduto(i, 'nome', e.target.value)}
                  placeholder="Nome do produto" className="flex-1 bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                <input value={p.quantidade} onChange={e => updateProduto(i, 'quantidade', parseInt(e.target.value) || 1)}
                  type="number" min="1" className="w-16 bg-gray-800 border border-white/10 rounded-lg px-2 py-2.5 text-sm text-white text-center focus:outline-none focus:border-blue-500/50" />
                <input value={p.preco} onChange={e => updateProduto(i, 'preco', parseFloat(e.target.value) || 0)}
                  type="number" step="0.01" min="0" placeholder="R$" className="w-24 bg-gray-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white text-right focus:outline-none focus:border-blue-500/50" />
                <button onClick={() => removeProduto(i)} className="text-red-400 hover:text-red-300 p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Salvar */}
        <button onClick={salvar} disabled={saving || !cliente.trim() || !endereco.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl text-base font-bold hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] transition-all disabled:opacity-50 shadow-lg shadow-blue-900/30">
          {saving ? 'Cadastrando...' : 'Cadastrar Entrega'}
        </button>
      </main>
    </div>
  );
}
