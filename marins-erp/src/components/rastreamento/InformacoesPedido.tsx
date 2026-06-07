'use client';

import type { RastreamentoProduto } from '@/types/rastreamento';

interface Props {
  produtos: RastreamentoProduto[];
  clienteNome: string;
  enderecoCompleto: string;
  pedidoId: string;
}

export default function InformacoesPedido({ produtos, clienteNome, enderecoCompleto, pedidoId }: Props) {
  const total = produtos.reduce((s, p) => s + p.preco * p.quantidade, 0);

  return (
    <div>
      <h3 className="text-white font-bold text-sm mb-3">📋 Detalhes do Pedido</h3>
      <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5 space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Pedido</span>
          <span className="text-white font-bold text-sm">{pedidoId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Cliente</span>
          <span className="text-white text-sm">{clienteNome}</span>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-gray-400 text-xs">Endereço</span>
          <span className="text-white text-sm text-right max-w-[60%]">{enderecoCompleto}</span>
        </div>
      </div>

      <h3 className="text-white font-bold text-sm mb-3">🛒 Produtos</h3>
      <div className="space-y-2 mb-4">
        {produtos.map((p, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-800/50 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-lg">📦</div>
              <div>
                <div className="text-white text-sm font-medium">{p.nome}</div>
                <div className="text-gray-500 text-xs">Qtd: {p.quantidade}</div>
              </div>
            </div>
            <div className="text-white font-bold">R$ {(p.preco * p.quantidade).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center bg-blue-600/10 rounded-xl p-4 border border-blue-500/20">
        <span className="text-gray-300 font-bold text-sm">Total do Pedido</span>
        <span className="text-white font-bold text-lg">R$ {total.toFixed(2)}</span>
      </div>
    </div>
  );
}
