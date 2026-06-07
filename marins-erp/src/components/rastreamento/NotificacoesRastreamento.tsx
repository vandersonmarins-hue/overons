'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';

export default function NotificacoesRastreamento() {
  const [permisso, setPermisso] = useState<NotificationPermission | 'unavailable'>('default');
  const [ativo, setAtivo] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermisso(Notification.permission);
      setAtivo(Notification.permission === 'granted');
    } else {
      setPermisso('unavailable');
    }
  }, []);

  const solicitar = async () => {
    if (permisso === 'unavailable') return alert('Notificações não suportadas neste navegador');
    const result = await Notification.requestPermission();
    setPermisso(result);
    setAtivo(result === 'granted');
    if (result === 'granted') {
      new Notification('🔔 Notificações ativadas!', { body: 'Você receberá alertas sobre sua entrega.', icon: '/favicon.ico' });
    }
  };

  const testar = () => {
    if (ativo && 'Notification' in window) {
      new Notification('🚚 Sua entrega está chegando!', { body: 'O motorista está a 5 minutos.', icon: '/favicon.ico' });
    }
  };

  if (permisso === 'unavailable') return null;

  return (
    <div className="bg-gray-900/80 rounded-xl p-4 border border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ativo ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
          {ativo ? <Bell size={20} /> : <BellOff size={20} />}
        </div>
        <div>
          <div className="text-white text-sm font-bold">Notificações</div>
          <div className="text-xs text-gray-500">{ativo ? 'Ativadas' : 'Desativadas'}</div>
        </div>
      </div>
      <button onClick={ativo ? testar : solicitar}
        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${ativo ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
        {ativo ? 'Testar' : 'Ativar'}
      </button>
    </div>
  );
}
