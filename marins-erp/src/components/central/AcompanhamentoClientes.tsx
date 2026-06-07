'use client';

import { useEffect, useState } from 'react';
import { User, Eye, EyeOff, Clock } from 'lucide-react';

interface AcessoRegistrado {
  chave: string;
  pedidoId: string;
  cliente: string;
  primeiroAcesso: string;
  ultimoAcesso: string;
}

export default function AcompanhamentoClientes() {
  const [acessos, setAcessos] = useState<AcessoRegistrado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/acesso')
      .then(r => r.json())
      .then(d => setAcessos(d.acessos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 text-sm py-4 text-center">Carregando...</div>;

  return (
    <div className="bg-gray-900/80 rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Eye size={16} className="text-blue-400" /> Acompanhamento dos Clientes
        </h3>
        <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
          {acessos.length} cliente{acessos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {acessos.length === 0 ? (
        <div className="flex items-center gap-3 text-gray-500 text-sm py-3">
          <EyeOff size={16} />
          <span>Nenhum cliente acompanhou a entrega <span className="text-gray-600 font-bold">(S/Acomp)</span></span>
        </div>
      ) : (
        <div className="space-y-2">
          {acessos.map(a => (
            <div key={a.chave} className="flex items-center justify-between bg-gray-800/50 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <User size={16} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{a.cliente}</div>
                  <div className="text-gray-500 text-xs">{a.pedidoId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-xs flex items-center gap-1">
                  <Clock size={10} /> {new Date(a.ultimoAcesso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-gray-600 text-xs">chave: {a.chave}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
