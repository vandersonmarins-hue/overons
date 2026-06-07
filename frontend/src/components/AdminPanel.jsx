import { useEffect, useState } from 'react';
import { api, getEmpresaId } from '../hooks/useApi';
import './AdminPanel.css';

export default function AdminPanel() {
  const [tab, setTab] = useState('dashboard');
  const [dash, setDash] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [payments, setPayments] = useState([]);
  const [inadimplentes, setInadimplentes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    setLoading(true);
    api('/api/admin/dashboard').then(setDash).catch(() => {});
    api('/api/admin/companies').then(setCompanies).catch(() => {});
    api('/api/admin/payments').then(setPayments).catch(() => {});
    api('/api/admin/reports/inadimplencia').then(setInadimplentes).catch(() => {});
    setTimeout(() => setLoading(false), 300);
  };

  useEffect(() => { loadAll(); }, []);

  const blockCompany = async (id) => {
    await fetch(`/api/admin/companies/${id}/block`, { method: 'PUT' });
    loadAll();
  };
  const unblockCompany = async (id) => {
    await fetch(`/api/admin/companies/${id}/unblock`, { method: 'PUT' });
    loadAll();
  };

  return (
    <div className="admin-panel">
      {/* Nav */}
      <div className="admin-nav">
        <button className={`admin-nav-btn ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}><i className="fas fa-chart-pie"></i> Painel</button>
        <button className={`admin-nav-btn ${tab === 'companies' ? 'active' : ''}`} onClick={() => setTab('companies')}><i className="fas fa-building"></i> Empresas</button>
        <button className={`admin-nav-btn ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}><i className="fas fa-credit-card"></i> Pagamentos</button>
        <button className={`admin-nav-btn ${tab === 'inadimplentes' ? 'active' : ''}`} onClick={() => setTab('inadimplentes')}><i className="fas fa-exclamation-triangle"></i> Inadimplentes</button>
      </div>

      {loading && <div className="admin-loading">📊 Carregando...</div>}

      {!loading && tab === 'dashboard' && dash && (
        <div className="admin-dash">
          <h4 className="admin-title"><i className="fas fa-chart-pie"></i> Painel Financeiro</h4>
          <div className="admin-cards">
            <div className="admin-card"><span className="admin-card-num">{dash.empresas?.ativas || 0}</span><span className="admin-card-label">Empresas Ativas</span><span className="admin-card-sub">Total: {dash.empresas?.total || 0}</span></div>
            <div className="admin-card"><span className="admin-card-num">{dash.empresas?.bloqueadas || 0}</span><span className="admin-card-label">Bloqueadas</span></div>
            <div className="admin-card"><span className="admin-card-num">{dash.empresas?.trial || 0}</span><span className="admin-card-label">Em Trial</span></div>
            <div className="admin-card highlight"><span className="admin-card-num">R$ {Number(dash.financeiro?.faturamentoMes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span><span className="admin-card-label">Faturamento do Mês</span></div>
            <div className="admin-card highlight"><span className="admin-card-num">R$ {Number(dash.financeiro?.faturamentoAno || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span><span className="admin-card-label">Faturamento do Ano</span></div>
            <div className="admin-card danger"><span className="admin-card-num">R$ {Number(dash.financeiro?.aReceber || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span><span className="admin-card-label">A Receber</span></div>
            <div className="admin-card danger"><span className="admin-card-num">{dash.empresas?.inadimplentes || 0}</span><span className="admin-card-label">Inadimplentes</span></div>
          </div>
        </div>
      )}

      {!loading && tab === 'companies' && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h4 className="admin-title"><i className="fas fa-building"></i> Empresas</h4>
            <button className="admin-btn primary" onClick={() => {
              const nome = prompt('Nome da empresa:');
              if (!nome) return;
              const cnpj = prompt('CNPJ:');
              if (!cnpj) return;
              const resp = prompt('Responsavel:');
              if (!resp) return;
              const email = prompt('Email:');
              if (!email) return;
              fetch('/api/admin/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, cnpj, responsavel: resp, email, plano: 'basico' }) })
                .then(() => loadAll());
            }}>+ Nova Empresa</button>
          </div>
          <table className="admin-table">
            <thead><tr><th>Empresa</th><th>Plano</th><th>Status</th><th>Motoristas</th><th>Limite</th><th>Ações</th></tr></thead>
            <tbody>
              {companies.map(c => {
                const pct = c.max_entregadores > 0 ? Math.round((c.motoristas_cadastrados || 0) / c.max_entregadores * 100) : 0;
                const barColor = pct >= 90 ? '#d63031' : pct >= 70 ? '#fdcb6e' : '#00b894';
                return (
                  <tr key={c.id}>
                    <td><b>{c.nome}</b><br/><span className="admin-cell-small">{c.responsavel}</span></td>
                    <td>
                      <select value={c.plano} onChange={e => {
                        const planos = { trial: 3, basico: 5, profissional: 20, enterprise: 100 };
                        const veic = { trial: 2, basico: 3, profissional: 10, enterprise: 50 };
                        const p = e.target.value;
                        fetch(`/api/admin/companies/${c.id}/plan`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({plano: p, max_entregadores: planos[p], max_veiculos: veic[p]}) }).then(() => loadAll());
                      }} style={{padding:'2px 6px', borderRadius:4, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:11}}>
                        <option value="trial">Trial</option>
                        <option value="basico">Básico</option>
                        <option value="profissional">Profissional</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td><span className={`admin-status ${c.status}`}>{c.status === 'ativo' ? '🟢' : c.status === 'bloqueado' ? '🔴' : c.status === 'trial' ? '🟡' : '⚪'}</span></td>
                    <td style={{minWidth:120}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{fontSize:12,fontWeight:'bold',color: barColor}}>{c.motoristas_logados || 0}/{c.motoristas_cadastrados || 0}</span>
                        <div style={{flex:1,height:6,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                          <div style={{height:'100%',width:pct+'%',background:barColor,borderRadius:3,transition:'width 0.3s'}}></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <input type="number" value={c.max_entregadores || 5} min={1} max={999}
                        onChange={e => fetch(`/api/admin/companies/${c.id}/plan`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({max_entregadores: parseInt(e.target.value)}) }).then(() => loadAll())}
                        style={{width:50,padding:'2px 4px',borderRadius:4,border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text)',fontSize:11,textAlign:'center'}} />
                    </td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        {c.status !== 'bloqueado' ? (
                          <button className="admin-btn small danger" onClick={() => blockCompany(c.id)}>🚫</button>
                        ) : (
                          <button className="admin-btn small success" onClick={() => unblockCompany(c.id)}>✅</button>
                        )}
                        <button className="admin-btn small" style={{background:'var(--accent)',color:'#fff'}} onClick={() => {
                          const v = prompt('Valor pago:', '0');
                          if (v) fetch('/api/admin/payments', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({empresa_id: c.id, valor: parseFloat(v), metodo: 'pix'}) }).then(() => loadAll());
                        }}>💰</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'payments' && (
        <div className="admin-section">
          <h4 className="admin-title"><i className="fas fa-credit-card"></i> Histórico de Pagamentos</h4>
          <table className="admin-table">
            <thead><tr><th>Empresa</th><th>Valor</th><th>Vencimento</th><th>Pagamento</th><th>Método</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td><b>{p.empresa_nome}</b></td>
                  <td className="admin-cell-mono">R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="admin-cell-mono">{p.data_vencimento}</td>
                  <td className="admin-cell-mono">{p.pago_em || '—'}</td>
                  <td>{p.metodo}</td>
                  <td><span className={`admin-status ${p.status}`}>{p.status === 'pago' ? '✅ Pago' : p.status === 'atrasado' ? '🔴 Atrasado' : '⏳ Pendente'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === 'inadimplentes' && (
        <div className="admin-section">
          <h4 className="admin-title"><i className="fas fa-exclamation-triangle"></i> Inadimplentes</h4>
          {inadimplentes.length === 0 ? (
            <div className="admin-empty">🎉 Nenhum inadimplente!</div>
          ) : (
            <table className="admin-table">
              <thead><tr><th>Empresa</th><th>Responsável</th><th>Contato</th><th>Valor Devido</th><th>Dias Atraso</th><th>Ações</th></tr></thead>
              <tbody>
                {inadimplentes.map(i => (
                  <tr key={i.id} className="admin-row-danger">
                    <td><b>{i.nome}</b></td>
                    <td>{i.responsavel}</td>
                    <td><span className="admin-cell-small">{i.email}<br/>{i.telefone || ''}</span></td>
                    <td className="admin-cell-mono" style={{color:'#d63031',fontWeight:'bold'}}>R$ {Number(i.total_devido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td><span className="admin-badge danger">{Math.round(i.dias_atraso)} dias</span></td>
                    <td>
                      <button className="admin-btn small success" onClick={() => unblockCompany(i.id)} style={{fontSize:10,padding:'3px 7px'}}>🔓 Desb</button>
                      <button className="admin-btn small" onClick={() => {
                        const v = prompt('Valor recebido:', i.total_devido);
                        if (v) fetch('/api/admin/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empresa_id: i.id, valor: parseFloat(v), metodo: 'pix' }) }).then(() => { unblockCompany(i.id); loadAll(); });
                      }} style={{marginLeft:4,fontSize:10,padding:'3px 7px'}}>💰 Rec</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
