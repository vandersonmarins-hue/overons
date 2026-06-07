import { useState, useEffect } from 'react';
import './MessageSender.css';

export default function MessageSender({ socket, drivers }) {
  const [driverId, setDriverId] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState({ totalMotoristas: 0, totalSockets: 0 });
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    fetch('/api/drivers-status').then(r => r.json()).then(setStatus).catch(() => {});
  }, [drivers]);

  const send = () => {
    if (!driverId || !message.trim()) return;
    const msg = message.trim();
    
    // Tenta via Socket.IO
    if (socket && socket.connected) {
      socket.emit('send-message', { driverId, message: msg, type: 'text' });
    }
    
    // Tenta via REST (fallback)
    fetch('/api/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, message: msg, empresa: 'Overons' })
    }).catch(() => {});
    
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

      {/* Diagnostico */}
      <div className="msg-diag">
        <hr style={{border:'none',borderTop:'1px solid var(--border)',margin:'16px 0 10px'}}/>
        <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>
          <strong>🔍 Diagnóstico:</strong><br/>
          Motoristas no servidor: <b>{status.totalMotoristas}</b><br/>
          Sockets conectados: <b>{status.totalSockets}</b><br/>
          Socket.IO conectado: <b>{socket?.connected ? '🟢 Sim' : '🔴 Não'}</b>
        </div>
        <button onClick={() => {
          fetch('/api/drivers-status').then(r => r.json()).then(d => {
            setTestResult(JSON.stringify(d.motoristas?.map(m => m.nome || m.id + ' (' + m.status + ')'), null, 2));
          }).catch(() => setTestResult('Erro ao consultar'));
        }} style={{padding:'6px 12px',border:'1px solid var(--border)',borderRadius:6,background:'var(--bg)',color:'var(--text)',fontSize:11,cursor:'pointer'}}>
          🔄 Ver motoristas conectados
        </button>
        {testResult && <pre style={{fontSize:10,color:'var(--text-muted)',marginTop:6,whiteSpace:'pre-wrap',background:'var(--bg)',padding:8,borderRadius:6}}>{testResult}</pre>}
      </div>
    </div>
  );
}
