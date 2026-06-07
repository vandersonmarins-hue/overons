import { useEffect, useState } from 'react';
import './DeliveryPanel.css';

const STATUS_MAP = {
  pendente: { icon: '⏳', label: 'Aguardando Motorista', color: '#fdcb6e' },
  aceita: { icon: '✅', label: 'Motorista a Caminho', color: '#00b894' },
  recusada: { icon: '❌', label: 'Recusada', color: '#d63031' },
  concluida: { icon: '✅', label: 'Concluida', color: '#00b894' },
  ENTREGUE: { icon: '✅', label: 'Entregue', color: '#00b894' },
  SAIU_PARA_ENTREGA: { icon: '🚚', label: 'Em Rota', color: '#0984e3' },
  PROXIMO_CLIENTE: { icon: '📍', label: 'Proximo', color: '#00b894' },
  EM_SEPARACAO: { icon: '📦', label: 'Separacao', color: '#fdcb6e' },
};

export default function DeliveryPanel({ deliveryLog, socket }) {
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/entregas')
      .then(r => r.json())
      .then(d => setAllDeliveries(d || []))
      .catch(() => {})
      .then(() => setLoading(false));
  };

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, []);

  useEffect(() => {
    if (!socket) return;
    const h = () => load();
    socket.on('new-delivery-log', h);
    socket.on('delivery-accepted', h);
    return () => { socket.off('new-delivery-log', h); socket.off('delivery-accepted', h); };
  }, [socket]);

  const merged = allDeliveries.slice();
  merged.sort((a, b) => ((b.criadaEm || b.createdAt) || '').localeCompare((a.criadaEm || a.createdAt) || ''));

  const fmt = (s) => { try { return new Date(s).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); } catch { return s || '—'; } };

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
          {merged.map((d, i) => {
            const st = STATUS_MAP[d.status] || { icon: '📋', label: d.status || 'Pendente', color: '#636e72' };
            return (
              <div key={d.id || d.pedidoId || i} className="delivery-card" style={{borderLeftColor: st.color}}>
                <div className="del-card-header">
                  <span className="del-motorista">{st.icon} {d.cliente || d.clienteNome || d.driverId?.substring(0,10) || '—'}</span>
                  <span className="del-status" style={{fontSize:10, padding:'2px 6px', borderRadius:6, background: st.color + '22', color: st.color}}>{st.label}</span>
                </div>
                <div className="del-card-body">
                  <div className="del-info"><i className="fas fa-map-pin"></i> {d.endereco || d.enderecoCompleto || '—'}</div>
                  {d.chaveAcesso && <div className="del-info" style={{color:'#fdcb6e'}}><i className="fas fa-key"></i> Chave: {d.chaveAcesso}</div>}
                  {d.pedidoId && <div className="del-info"><i className="fas fa-hashtag"></i> {d.pedidoId}</div>}
                  {d.observacoes && <div className="del-info" style={{color:'#e17055'}}><i className="fas fa-sticky-note"></i> {d.observacoes}</div>}
                  <div className="del-info time"><i className="fas fa-clock"></i> {fmt(d.criadaEm || d.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
