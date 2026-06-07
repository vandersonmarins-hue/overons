'use client';

import type { RastreamentoHistorico, RastreamentoStatus } from '@/types/rastreamento';
import { STATUS_LABELS } from '@/types/rastreamento';

const STATUS_ICONS: Record<string, string> = {
  CONFIRMADO: '✅',
  EM_SEPARACAO: '📦',
  SAIU_PARA_ENTREGA: '🚚',
  PROXIMO_CLIENTE: '📍',
  ENTREGUE: '🎉',
};

interface Props {
  historico: RastreamentoHistorico[];
  statusAtual: RastreamentoStatus;
}

export default function StatusTimeline({ historico, statusAtual }: Props) {
  const sorted = [...historico].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="space-y-0">
      {sorted.map((item, idx) => {
        const isLast = idx === sorted.length - 1;
        const icon = STATUS_ICONS[item.status] || '📋';
        return (
          <div key={item.id} className="flex gap-4 relative">
            {/* Linha vertical */}
            {!isLast && <div className="w-0.5 bg-blue-500/30 absolute left-[17px] top-10 bottom-0" />}
            {/* Bolinha */}
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${isLast ? 'bg-blue-600 shadow-lg shadow-blue-600/30' : 'bg-gray-800 border border-blue-500/30'}`}>
              {icon}
            </div>
            {/* Conteúdo */}
            <div className={`pb-6 flex-1 ${isLast ? '' : ''}`}>
              <div className={`text-sm font-bold ${isLast ? 'text-blue-400' : 'text-gray-300'}`}>
                {STATUS_LABELS[item.status as RastreamentoStatus]?.label || item.status}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{item.descricao}</div>
              <div className="text-xs text-gray-600 mt-1">
                {new Date(item.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
