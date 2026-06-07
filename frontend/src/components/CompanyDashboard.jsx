import { useState, useEffect } from 'react';
import useSocket from '../hooks/useSocket';
import { setEmpresaId, getEmpresaId, api } from '../hooks/useApi';
import DarkModeToggle from './DarkModeToggle';
import KpiCards from './KpiCards';
import Top3 from './Top3';
import HeatMap from './HeatMap';
import AlertsPanel from './AlertsPanel';
import RankingTable from './RankingTable';
import ChartsSection from './ChartsSection';
import DeliveryPanel from './DeliveryPanel';
import ReportsPanel from './ReportsPanel';
import AdminPanel from './AdminPanel';
import './CompanyDashboard.css';

const ADMIN_KEY = 'overons_admin';
const DEFAULT_PASSWORD = 'overons2024';

function isAdmin() { return localStorage.getItem(ADMIN_KEY) === 'true'; }

export default function CompanyDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [section, setSection] = useState(null);
  const [adminMode, setAdminMode] = useState(isAdmin());
  const [showLogin, setShowLogin] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(getEmpresaId());
  const { socket, connected, drivers, deliveryLog } = useSocket();

  // Carregar empresas (so para admin)
  useEffect(() => {
    if (adminMode) {
      api('/api/admin/companies').then(setCompanies).catch(() => {});
    }
  }, [adminMode]);

  const openSection = (s) => {
    setSection(s);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout" id="app">
      {/* Mapa em tela cheia */}
      <div className="fullscreen-map">
        <HeatMap drivers={drivers} deliveryLog={deliveryLog} />
      </div>

      {/* Camada escura quando sidebar aberta */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      {/* Botao hamburguer flutuante */}
      <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Status de conexao flutuante */}
      <div className={`conn-float ${connected ? 'online' : 'offline'}`}>
        <span className="conn-dot-float"></span>
      </div>

      {/* Botao admin flutuante (logar/deslogar) */}
      <div className="admin-float" title={adminMode ? 'Sair do modo Admin' : 'Acesso Admin'}>
        <button onClick={() => {
          if (adminMode) {
            localStorage.removeItem(ADMIN_KEY);
            setAdminMode(false);
            setSection(null);
          } else {
            setShowLogin(true);
            setPwdInput('');
            setPwdError(false);
          }
        }} style={{
          width:36, height:36, borderRadius:8, border:'1px solid var(--border)',
          background: adminMode ? 'rgba(253,203,110,0.2)' : 'var(--card-bg)',
          color: adminMode ? '#fdcb6e' : 'var(--text-muted)',
          fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <i className={`fas ${adminMode ? 'fa-unlock' : 'fa-lock'}`}></i>
        </button>
      </div>

      {/* Modal de login admin */}
      {showLogin && (
        <div className="sidebar-overlay" style={{zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => setShowLogin(false)}>
          <div style={{background:'var(--card-bg)', borderRadius:16, padding:'30px 28px', maxWidth:340, width:'90%', border:'1px solid var(--border)', boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}} onClick={e => e.stopPropagation()}>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:40,marginBottom:8}}>🔐</div>
              <h3 style={{color:'var(--text)',fontSize:18,margin:0}}>Acesso Restrito</h3>
              <p style={{color:'var(--text-muted)',fontSize:13,marginTop:4}}>Digite a senha mestra para acessar o painel Admin</p>
            </div>
            <input type="password" value={pwdInput} onChange={e => { setPwdInput(e.target.value); setPwdError(false); }}
              onKeyDown={e => e.key === 'Enter' && document.getElementById('btnAdminLogin').click()}
              placeholder="Senha mestra" autoFocus
              style={{width:'100%',padding:'12px 14px', borderRadius:10, border:'2px solid ' + (pwdError ? '#d63031' : 'var(--border)'), background:'var(--bg)', color:'var(--text)', fontSize:14, outline:'none', marginBottom:12, textAlign:'center'}} />
            {pwdError && <p style={{color:'#d63031',fontSize:12,textAlign:'center',marginBottom:8}}>🔒 Senha incorreta!</p>}
            <button id="btnAdminLogin" onClick={() => {
              const pwd = import.meta.env.VITE_ADMIN_PASSWORD || DEFAULT_PASSWORD;
              if (pwdInput === pwd) {
                localStorage.setItem(ADMIN_KEY, 'true');
                setAdminMode(true);
                setShowLogin(false);
              } else {
                setPwdError(true);
              }
            }} style={{width:'100%',padding:12, border:'none', borderRadius:10, background:'var(--accent)', color:'#fff', fontSize:14, fontWeight:'bold', cursor:'pointer'}}>
              <i className="fas fa-unlock"></i> Acessar Admin
            </button>
          </div>
        </div>
      )}

      {/* Botao modo escuro flutuante */}
      <div className="theme-float">
        <DarkModeToggle />
      </div>

      {/* Sidebar deslizante */}
      <div className={`slide-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2><i className="fas fa-truck"></i> Overons</h2>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {adminMode && companies.length > 0 && (
              <select value={selectedCompany} onChange={e => { setSelectedCompany(e.target.value); setEmpresaId(e.target.value); }}
                style={{padding:'4px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:11, maxWidth:140}}>
                <option value="">📊 Todas</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.nome.substring(0,18)}</option>
                ))}
              </select>
            )}
            <button className="close-btn" onClick={closeSidebar}>✕</button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`side-btn ${section === 'dashboard' ? 'active' : ''}`}
            onClick={() => openSection('dashboard')}>
            <i className="fas fa-chart-pie"></i> Dashboard
          </button>
          <button className={`side-btn ${section === 'deliveries' ? 'active' : ''}`}
            onClick={() => openSection('deliveries')}>
            <i className="fas fa-box"></i> Entregas
          </button>
          <button className={`side-btn ${section === 'ranking' ? 'active' : ''}`}
            onClick={() => openSection('ranking')}>
            <i className="fas fa-trophy"></i> Ranking
          </button>
          <button className={`side-btn ${section === 'alerts' ? 'active' : ''}`}
            onClick={() => openSection('alerts')}>
            <i className="fas fa-bell"></i> Alertas
            <span className="side-badge">{/* alert count */}</span>
          </button>
          <button className={`side-btn ${section === 'charts' ? 'active' : ''}`}
            onClick={() => openSection('charts')}>
            <i className="fas fa-chart-line"></i> Gráficos
          </button>
          <button className={`side-btn ${section === 'reports' ? 'active' : ''}`}
            onClick={() => openSection('reports')}>
            <i className="fas fa-file-alt"></i> Relatórios
          </button>
          <button className={`side-btn ${section === 'messages' ? 'active' : ''}`}
            onClick={() => openSection('messages')}>
            <i className="fas fa-comment-dots"></i> Mensagens
          </button>
          {adminMode && (
            <button className={`side-btn ${section === 'admin' ? 'active' : ''}`}
              onClick={() => openSection('admin')}
              style={{borderTop:'2px solid #fdcb6e',marginTop:4}}>
              <i className="fas fa-shield-alt"></i> Admin
            </button>
          )}
        </nav>

        <div className="sidebar-content">
          {section === 'dashboard' && (
            <div className="side-section">
              <KpiCards socket={socket} />
              <Top3 />
            </div>
          )}
          {section === 'deliveries' && (
            <div className="side-section">
              <DeliveryPanel deliveryLog={deliveryLog} />
            </div>
          )}
          {section === 'ranking' && (
            <div className="side-section">
              <h4 className="side-title"><i className="fas fa-trophy"></i> Ranking</h4>
              <RankingTable />
            </div>
          )}
          {section === 'alerts' && (
            <div className="side-section">
              <h4 className="side-title"><i className="fas fa-bell"></i> Alertas</h4>
              <AlertsPanel />
            </div>
          )}
          {section === 'charts' && (
            <div className="side-section">
              <h4 className="side-title"><i className="fas fa-chart-line"></i> Gráficos</h4>
              <ChartsSection />
            </div>
          )}
          {section === 'reports' && (
            <div className="side-section">
              <h4 className="side-title"><i className="fas fa-file-alt"></i> Relatórios</h4>
              <ReportsPanel />
            </div>
          )}
          {section === 'messages' && (
            <div className="side-section">
              <MessageSender socket={socket} drivers={drivers} />
            </div>
          )}
          {section === 'admin' && (
            <div className="side-section">
              <AdminPanel />
            </div>
          )}
          {!section && (
            <div className="side-empty">
              <i className="fas fa-arrow-right"></i>
              <p>Selecione uma opção do menu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
