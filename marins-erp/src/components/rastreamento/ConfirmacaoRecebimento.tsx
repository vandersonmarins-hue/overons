'use client';

import { useState } from 'react';
import { CheckCircle, Star } from 'lucide-react';

interface Props {
  pedidoId: string;
  onConfirmado: () => void;
}

export default function ConfirmacaoRecebimento({ pedidoId, onConfirmado }: Props) {
  const [step, setStep] = useState<'confirm' | 'feedback' | 'done'>('confirm');
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);

  const confirmar = async () => {
    setSaving(true);
    try {
      await fetch(`/api/rastreamento/${pedidoId}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: rating > 0 ? `Avaliação: ${rating} estrelas` : '' }),
      });
      setStep('done');
      onConfirmado();
    } catch {}
    setSaving(false);
  };

  if (step === 'done') {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-3">🎉</div>
        <div className="text-white font-bold text-lg">Recebimento Confirmado!</div>
        <div className="text-gray-400 text-sm mt-1">Obrigado por comprar conosco!</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl p-5 border border-green-500/20 text-center">
      <div className="text-4xl mb-3">📦</div>
      <h3 className="text-white font-bold text-base mb-1">Recebeu o Pedido?</h3>
      <p className="text-gray-400 text-xs mb-4">Confirme para finalizar a entrega</p>

      {step === 'feedback' && (
        <div className="mb-4">
          <p className="text-gray-300 text-sm mb-2">Avalie seu atendimento:</p>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}
                className={`w-10 h-10 rounded-xl text-xl transition-all ${n <= rating ? 'scale-110' : 'opacity-40'}`}>
                <Star size={24} className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => step === 'confirm' ? setStep('feedback') : confirmar()} disabled={saving}
        className="w-full bg-green-600 text-white py-4 rounded-xl text-base font-bold hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-900/30">
        <CheckCircle size={20} /> {step === 'confirm' ? 'Sim, Recebi!' : 'Confirmar Recebimento'}
      </button>
      {step === 'feedback' && (
        <button onClick={() => confirmar()} className="mt-2 text-gray-500 text-xs hover:text-gray-300">Pular avaliação</button>
      )}
    </div>
  );
}
