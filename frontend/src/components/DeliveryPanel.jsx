import { useState } from 'react';
import './DeliveryPanel.css';

export default function DeliveryPanel({ deliveryLog, socket }) {
  const [showForm, setShowForm] = useState(false);
  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const cadastrar = async (e) => {
    e.preventDefault();
    if (!cliente || !endereco) return;
    setSaving(true);

    // Envia via Socket.IO
    if (socket && socket.connected) {
      socket.emit('assign-delivery', {
        driverId: '',
        endereco: endereco,
        cliente: cliente,
        valor: 0,
      });
    }

    // Salva localmente via REST
    try {
      await fetch('/api/entregas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente, endereco, observacoes, produtos: [] }),
      });
    } catch {}

    setCliente('');
    setEndereco('');
    setObservacoes('');
    setSaving(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setShowForm(false); }, 1500);
  };

  // Se nao tem deliveryLog, mostra vazio
  const showLog = deliveryLog && deliveryLog.length > 0;

  return (
    <div className="delivery-panel">
      <div className="delivery-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <h4 className="side-title" style={{margin:0}}><i className="fas fa-box"></i> Entregas</h4>
        <button onClick={() => setShowForm(!showForm)}
          style={{padding:'6px 14px', border:'none', borderRadius:'8px', background:'var(--accent)', color:'#fff', fontSize:'12px', fontWeight:'bold', cursor:'pointer'}}>
          {showForm ? '✕ Fechar' : '+ Nova'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={cadastrar} style={{background:'var(--card-bg)', borderRadius:10, padding:16, marginBottom:16, border:'1px solid var(--border)'}}>
          <h5 style={{margin:'0 0 12px', color:'var(--text)', fontSize:14}}>📦 Cadastrar Entrega</h5>
          <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nome do cliente"
            style={{width:'100%', padding:'10px 12px', marginBottom:8, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:13}} required />
          <textarea value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Endereco completo"
            rows={2} style={{width:'100%', padding:'10px 12px', marginBottom:8, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:13, fontFamily:'inherit'}} required />
          <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Observacoes (opcional)"
            rows={2} style={{width:'100%', padding:'10px 12px', marginBottom:12, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:13, fontFamily:'inherit'}} />
          <button type="submit" disabled={saving || !cliente || !endereco}
            style={{width:'100%', padding:12, border:'none', borderRadius:6, background:'var(--accent)', color:'#fff', fontSize:14, fontWeight:'bold', cursor:'pointer', opacity: saving ? 0.6 : 1}}>
            {saving ? 'Cadastrando...' : '✅ Cadastrar'}
          </button>
          {success && <p style={{textAlign:'center', color:'var(--accent)', fontSize:13, marginTop:8}}>✅ Entrega cadastrada!</p>}
        </form>
      )}

      {!showLog && !showForm && (
        <div className="delivery-empty">Nenhuma entrega registrada ainda</div>
      )}

      {showLog && (
        <div className="delivery-list" style={{maxHeight:300, overflowY:'auto'}}>
          {deliveryLog.map((d, i) => (
            <div key={d.id || i} className={`delivery-card ${d.status}`}>
              <div className="del-card-header">
                <span className="del-motorista">🚚 {d.nomeMotorista || d.driverId?.substring(0, 10) || '—'}</span>
                <span className={`del-status ${d.status}`}>
                  {d.status === 'concluida' ? '✅' : '📋'} {d.status === 'concluida' ? 'Concluída' : 'Atribuída'}
                </span>
              </div>
              <div className="del-card-body">
                <div className="del-info"><i className="fas fa-map-pin"></i> {d.endereco || '—'}</div>
                {d.cliente && <div className="del-info"><i className="fas fa-user"></i> {d.cliente}</div>}
                {d.valor > 0 && <div className="del-info valor"><i className="fas fa-dollar-sign"></i> R$ {parseFloat(d.valor).toFixed(2)}</div>}
                <div className="del-info time"><i className="fas fa-clock"></i> {new Date(d.criadaEm || d.concluidaEm || Date.now()).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
