import { useState } from 'react';
import './MessageSender.css';

export default function MessageSender({ socket, drivers }) {
  const [driverId, setDriverId] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!driverId || !message.trim() || !socket) return;
    socket.emit('send-message', {
      driverId,
      message: message.trim(),
      type: 'text',
    });
    setMessage('');
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="msg-sender">
      <h4 className="side-title"><i className="fas fa-comment-dots"></i> Enviar Mensagem</h4>
      <p className="msg-hint">A mensagem aparecerá como popup na tela do motorista</p>

      <div className="msg-field">
        <label>Motorista</label>
        <select value={driverId} onChange={e => setDriverId(e.target.value)}>
          <option value="">— Selecione —</option>
          {drivers.filter(d => d.status === 'online').map(d => (
            <option key={d.id} value={d.id}>{d.nome || d.id}</option>
          ))}
          {drivers.filter(d => d.status !== 'online').map(d => (
            <option key={d.id} value={d.id}>{d.nome || d.id} (offline)</option>
          ))}
        </select>
      </div>

      <div className="msg-field">
        <label>Mensagem</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Digite a mensagem para o motorista..."
          rows={4} maxLength={300} />
        <span className="msg-count">{message.length}/300</span>
      </div>

      <button className="msg-send-btn" onClick={send} disabled={!driverId || !message.trim()}>
        <i className="fas fa-paper-plane"></i> Enviar
      </button>

      {sent && <div className="msg-success">✅ Mensagem enviada com sucesso!</div>}
    </div>
  );
}
