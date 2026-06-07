import { useState } from 'react';
import useSocket from '../hooks/useSocket';
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

export default function CompanyDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [section, setSection] = useState(null);
  const { socket, connected, drivers, deliveryLog } = useSocket();

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

      {/* Botao modo escuro flutuante */}
      <div className="theme-float">
        <DarkModeToggle />
      </div>

      {/* Sidebar deslizante */}
      <div className={`slide-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2><i className="fas fa-truck"></i> Overons</h2>
          <button className="close-btn" onClick={closeSidebar}>✕</button>
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
          <button className={`side-btn ${section === 'admin' ? 'active' : ''}`}
            onClick={() => openSection('admin')}
            style={{borderTop:'2px solid #fdcb6e',marginTop:4}}>
            <i className="fas fa-shield-alt"></i> Admin
          </button>
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
