import { useEffect, useState } from 'react';
import './CentralMonitor.css';

export default function CentralMonitor() {
  const [pedidos, setPedidos] = useState([]);
  const [stats, setStats] = useState({ total: 0, emRota: 0, entregue: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await fetch('/api/central/rastreamento');
      if (r.ok) {
        const d = await r.json();
        setPedidos(d.pedidos || []);
        setStats(d.resumo || {});
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, []);

  const statusIcon = (s) => {
    const map = { EM_SEPARACAO: '📦', SAIU_PARA_ENTREGA: '🚚', PROXIMO_CLIENTE: '📍', ENTREGUE: '✅' };
    return map[s] || '📋';
  };

  return (
    <div className="central-monitor">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
        <h4 className="side-title" style={{margin:0}}><i className="fas fa-tv"></i> Central</h4>
        <button onClick={load} style={{padding:'6px 14px', border:'none', borderRadius:6, background:'var(--accent)', color:'#fff', fontSize:11, cursor:'pointer'}}>
          <i className="fas fa-sync"></i>
        </button>
      </div>

      {/* Stats */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14}}>
        <div className="central-card"><span className="central-num">{stats.total || 0}</span><span className="central-label">Total</span></div>
        <div className="central-card"><span className="central-num">{stats.emRota || 0}</span><span className="central-label">Em Rota</span></div>
        <div className="central-card"><span className="central-num">{stats.entregue || 0}</span><span className="central-label">Entregues</span></div>
      </div>

      {/* Lista */}
      <div style={{maxHeight:400, overflowY:'auto'}}>
        {pedidos.length === 0 ? (
          <div className="central-empty">Nenhuma entrega ativa</div>
        ) : (
          pedidos.map((p) => (
            <div key={p.pedidoId} className="central-item">
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                <span className="central-cliente">{p.clienteNome}</span>
                <span className="central-status">{statusIcon(p.status)} {p.status?.replace(/_/g, ' ')}</span>
              </div>
              <div className="central-endereco">{p.enderecoCompleto}</div>
              <div style={{display:'flex', gap:12, fontSize:11, color:'var(--text-muted)', marginTop:4}}>
                <span>🚚 {p.distanciaRestante?.toFixed(1)} km</span>
                <span>⏱️ {p.tempoRestante} min</span>
                <span>#{p.pedidoId}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{marginTop:12, padding:'10px 12px', background:'var(--card-bg)', borderRadius:8, border:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)', textAlign:'center'}}>
        <a href="http://localhost:3001/central" target="_blank" style={{color:'var(--accent)'}}>
          <i className="fas fa-external-link-alt"></i> Central Completa
        </a>
      </div>
    </div>
  );
}
