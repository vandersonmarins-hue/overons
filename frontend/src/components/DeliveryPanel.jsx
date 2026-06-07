import { useEffect, useState } from 'react';
import './DeliveryPanel.css';

export default function DeliveryPanel({ deliveryLog }) {
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const res = await fetch('/api/entregas');
        if (res.ok) {
          const data = await res.json();
          setAllDeliveries(data || []);
        }
      } catch {}
      setLoading(false);
    };
    fetchDeliveries();
    const id = setInterval(fetchDeliveries, 10000);
    return () => clearInterval(id);
  }, []);

  // Merge API deliveries + real-time deliveryLog
  const merged = [];
  const seen = new Set();

  // Primeiro as da API (persistidas)
  for (const d of allDeliveries) {
    merged.push({ ...d, _source: 'api' });
    seen.add(d.pedidoId || d.id);
  }

  // Depois as do tempo real (Socket.IO) que ainda nao estao na lista
  if (deliveryLog) {
    for (const d of deliveryLog) {
      const key = d.id || d.pedidoId || Math.random();
      if (!seen.has(key)) {
        merged.push({ ...d, _source: 'socket' });
        seen.add(key);
      }
    }
  }

  // Ordenar do mais recente primeiro
  merged.sort((a, b) => {
    const da = a.criadaEm || a.createdAt || '';
    const db = b.criadaEm || b.createdAt || '';
    return db.localeCompare(da);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return dateStr; }
  };

  return (
    <div className="delivery-panel">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <h4 className="side-title" style={{margin:0}}>
          <i className="fas fa-box"></i> Entregas
          {merged.length > 0 && <span style={{fontSize:11, color:'var(--text-muted)', marginLeft:8}}>({merged.length})</span>}
        </h4>
        <a href="http://localhost:3001/central/nova-entrega" target="_blank"
          style={{padding:'6px 14px', border:'none', borderRadius:'8px', background:'var(--accent)', color:'#fff', fontSize:'12px', fontWeight:'bold', cursor:'pointer', textDecoration:'none'}}>
          + Nova
        </a>
      </div>

      {loading ? (
        <div style={{textAlign:'center', padding:20, color:'var(--text-muted)', fontSize:13}}>Carregando...</div>
      ) : merged.length === 0 ? (
        <div className="delivery-empty">Nenhuma entrega registrada</div>
      ) : (
        <div className="delivery-list" style={{maxHeight:400, overflowY:'auto'}}>
          {merged.map((d, i) => (
            <div key={d.id || d.pedidoId || i} className={`delivery-card ${d.status === 'concluida' || d.status === 'ENTREGUE' ? 'concluida' : ''}`}>
              <div className="del-card-header">
                <span className="del-motorista">
                  {d.status === 'ENTREGUE' || d.status === 'concluida' ? '✅' : d.status === 'SAIU_PARA_ENTREGA' || d.status === 'PROXIMO_CLIENTE' ? '🚚' : '📋'}
                  {' '}{d.cliente || d.clienteNome || d.driverId?.substring(0, 10) || '—'}
                </span>
                <span className={`del-status ${d.status === 'concluida' || d.status === 'ENTREGUE' ? 'concluida' : ''}`}
                  style={{fontSize:10, padding:'2px 6px', borderRadius:6, background: (d.status === 'concluida' || d.status === 'ENTREGUE') ? 'rgba(0,184,148,0.15)' : 'rgba(253,203,110,0.15)', color: (d.status === 'concluida' || d.status === 'ENTREGUE') ? '#00b894' : '#fdcb6e'}}>
                  {d.status === 'ENTREGUE' ? '✅ Entregue' :
                   d.status === 'concluida' ? '✅ Concluída' :
                   d.status === 'SAIU_PARA_ENTREGA' ? '🚚 Em Rota' :
                   d.status === 'PROXIMO_CLIENTE' ? '📍 Próximo' :
                   d.status === 'EM_SEPARACAO' ? '📦 Separação' :
                   d.status || '📋 Pendente'}
                </span>
              </div>
              <div className="del-card-body">
                <div className="del-info"><i className="fas fa-map-pin"></i> {d.endereco || d.enderecoCompleto || '—'}</div>
                {d.chaveAcesso && <div className="del-info" style={{color:'#fdcb6e'}}><i className="fas fa-key"></i> Chave: {d.chaveAcesso}</div>}
                {d.pedidoId && <div className="del-info"><i className="fas fa-hashtag"></i> {d.pedidoId}</div>}
                {d.observacoes && <div className="del-info" style={{color:'#e17055'}}><i className="fas fa-sticky-note"></i> {d.observacoes}</div>}
                <div className="del-info time"><i className="fas fa-clock"></i> {formatDate(d.criadaEm || d.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
