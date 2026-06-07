import { useEffect, useState } from 'react';
import './CentralMonitor.css';

export default function CentralMonitor() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      // Busca entregas reais do Overons
      const r = await fetch('/api/entregas');
      if (r.ok) {
        const entregas = await r.json();
        setPedidos(entregas || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, []);

  const stats = {
    total: pedidos.length,
    pendentes: pedidos.filter(p => p.status === 'pendente' || p.status === 'AGUARDANDO_CONFIRMACAO').length,
    aceitas: pedidos.filter(p => p.status === 'aceita' || p.status === 'SAIU_PARA_ENTREGA' || p.status === 'PROXIMO_CLIENTE').length,
    concluidas: pedidos.filter(p => p.status === 'concluida' || p.status === 'ENTREGUE').length,
  };

  const getStatus = (s) => {
    const map = {
      pendente: { icon: '⏳', label: 'Aguardando', color: '#fdcb6e' },
      AGUARDANDO_CONFIRMACAO: { icon: '⏳', label: 'Aguardando', color: '#fdcb6e' },
      aceita: { icon: '✅', label: 'Aceita', color: '#00b894' },
      SAIU_PARA_ENTREGA: { icon: '🚚', label: 'Em Rota', color: '#0984e3' },
      PROXIMO_CLIENTE: { icon: '📍', label: 'Proximo', color: '#00b894' },
      concluida: { icon: '✅', label: 'Concluida', color: '#00b894' },
      ENTREGUE: { icon: '✅', label: 'Entregue', color: '#00b894' },
      recusada: { icon: '❌', label: 'Recusada', color: '#d63031' },
    };
    return map[s] || { icon: '📋', label: s || 'Pendente', color: '#636e72' };
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
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:6, marginBottom:14}}>
        <div className="central-card"><span className="central-num">{stats.total}</span><span className="central-label">Total</span></div>
        <div className="central-card"><span className="central-num">{stats.pendentes}</span><span className="central-label">Pendentes</span></div>
        <div className="central-card"><span className="central-num">{stats.aceitas}</span><span className="central-label">Em Andamento</span></div>
        <div className="central-card"><span className="central-num">{stats.concluidas}</span><span className="central-label">Concluidas</span></div>
      </div>

      {/* Lista de entregas */}
      <div style={{maxHeight:400, overflowY:'auto'}}>
        {loading ? (
          <div className="central-empty">Carregando...</div>
        ) : pedidos.length === 0 ? (
          <div className="central-empty">Nenhuma entrega registrada</div>
        ) : (
          pedidos.map((p, i) => {
            const st = getStatus(p.status);
            return (
              <div key={p.id || p.pedidoId || i} className="central-item" style={{borderLeftColor: st.color}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                  <span className="central-cliente">{p.cliente || p.clienteNome || '—'}</span>
                  <span className="central-status" style={{background: st.color + '18', color: st.color, fontSize:10}}>{st.icon} {st.label}</span>
                </div>
                <div className="central-endereco">{p.endereco || p.enderecoCompleto || '—'}</div>
                {p.chaveAcesso && <div style={{fontSize:10, color:'#fdcb6e', marginTop:2}}>🔑 {p.chaveAcesso}</div>}
                <div style={{display:'flex', gap:8, fontSize:10, color:'var(--text-muted)', marginTop:2}}>
                  {p.pedidoId && <span>#{p.pedidoId}</span>}
                  {p.criadaEm && <span>{new Date(p.criadaEm).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</span>}
                </div>
              </div>
            );
          })
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
