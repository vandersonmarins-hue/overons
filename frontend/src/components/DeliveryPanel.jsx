import './DeliveryPanel.css';

export default function DeliveryPanel({ deliveryLog }) {
  const showLog = deliveryLog && deliveryLog.length > 0;

  return (
    <div className="delivery-panel">
      <div className="delivery-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <h4 className="side-title" style={{margin:0}}><i className="fas fa-box"></i> Entregas</h4>
        <a href="http://localhost:3001/central/nova-entrega" target="_blank"
          style={{padding:'6px 14px', border:'none', borderRadius:'8px', background:'var(--accent)', color:'#fff', fontSize:'12px', fontWeight:'bold', cursor:'pointer', textDecoration:'none'}}>
          + Nova
        </a>
      </div>

      {!showLog && (
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
