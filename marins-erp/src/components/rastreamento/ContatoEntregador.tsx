'use client';

import { Phone, MessageCircle } from 'lucide-react';

interface Props {
  motoristaNome: string;
  motoristaTelefone: string;
}

export default function ContatoEntregador({ motoristaNome, motoristaTelefone }: Props) {
  const linkWpp = `https://wa.me/55${motoristaTelefone.replace(/\D/g, '')}`;

  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/20">
      <h3 className="text-white font-bold text-sm mb-3">🚚 Entregador</h3>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          {motoristaNome.charAt(0)}
        </div>
        <div>
          <div className="text-white font-bold text-sm">{motoristaNome}</div>
          <div className="text-gray-400 text-xs">{motoristaTelefone}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <a href={`tel:${motoristaTelefone}`}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all">
          <Phone size={16} /> Ligar
        </a>
        <a href={linkWpp} target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-green-700 active:scale-95 transition-all">
          <MessageCircle size={16} /> WhatsApp
        </a>
      </div>
    </div>
  );
}
