import { useEffect, useState } from 'react';
import { api } from '../hooks/useApi';
import './MessageHistory.css';

export default function MessageHistory({ socket }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    api('/api/messages').then(setMessages).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => setMessages(data || []);
    socket.on('message-log-update', handler);
    return () => socket.off('message-log-update', handler);
  }, [socket]);

  if (!messages.length) {
    return (
      <div className="msg-history">
        <h4 className="side-title"><i className="fas fa-history"></i> Histórico de Mensagens</h4>
        <div className="msg-empty">Nenhuma mensagem enviada ainda</div>
      </div>
    );
  }

  return (
    <div className="msg-history">
      <h4 className="side-title"><i className="fas fa-history"></i> Últimas Mensagens</h4>
      <div className="msg-list">
        {messages.map(m => (
          <div key={m.id} className={`msg-item ${m.readAt ? 'lida' : 'pendente'}`}>
            <div className="msg-header">
              <span className="msg-driver">📤 {m.nomeMotorista || m.driverId?.substring(0, 10)}</span>
              <span className={`msg-status ${m.readAt ? 'lida' : ''}`}>
                {m.readAt ? '✅ Lida' : '⏳ Pendente'}
              </span>
            </div>
            <div className="msg-body">{m.message}</div>
            <div className="msg-times">
              <span className="msg-time">📨 {new Date(m.sentAt).toLocaleString()}</span>
              {m.readAt && <span className="msg-time read">👁️ {new Date(m.readAt).toLocaleString()}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
