import { useEffect, useState } from 'react';
import { api } from '../hooks/useApi';
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
            <thead><tr><th>Empresa</th><th>CNPJ</th><th>Responsável</th><th>Plano</th><th>Status</th><th>Vencimento</th><th>Ações</th></tr></thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.id}>
                  <td><b>{c.nome}</b></td>
                  <td className="admin-cell-mono">{c.cnpj}</td>
                  <td>{c.responsavel}</td>
                  <td><span className="admin-badge">{c.plano}</span></td>
                  <td><span className={`admin-status ${c.status}`}>{c.status === 'ativo' ? '🟢 Ativo' : c.status === 'bloqueado' ? '🔴 Bloqueado' : c.status === 'trial' ? '🟡 Trial' : '⚪ Cancelado'}</span></td>
                  <td className="admin-cell-mono">{c.ultimo_vencimento || '—'}</td>
                  <td>
                    {c.status !== 'bloqueado' ? (
                      <button className="admin-btn small danger" onClick={() => blockCompany(c.id)}>🔒 Bloquear</button>
                    ) : (
                      <button className="admin-btn small success" onClick={() => unblockCompany(c.id)}>🔓 Desbloquear</button>
                    )}
                  </td>
                </tr>
              ))}
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
                      <button className="admin-btn small success" onClick={() => unblockCompany(i.id)}>🔓 Desbloquear</button>
                      <button className="admin-btn small" onClick={() => {
                        const v = prompt('Valor recebido:', i.total_devido);
                        if (v) fetch('/api/admin/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empresa_id: i.id, valor: parseFloat(v), metodo: 'pix' }) }).then(() => { unblockCompany(i.id); loadAll(); });
                      }} style={{marginLeft:4}}>💰 Receber</button>
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
