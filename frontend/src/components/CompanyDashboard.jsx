import { useState } from 'react';
import useSocket from '../hooks/useSocket';
import DarkModeToggle from './DarkModeToggle';
import KpiCards from './KpiCards';
import Top3 from './Top3';
import HeatMap from './HeatMap';
import AlertsPanel from './AlertsPanel';
import RankingTable from './RankingTable';
import ChartsSection from './ChartsSection';
import ReportsPanel from './ReportsPanel';
import './CompanyDashboard.css';

export default function CompanyDashboard() {
  const [tab, setTab] = useState('dashboard');
  const { socket, connected, drivers, deliveryLog } = useSocket();

  return (
    <div className="app-layout" id="app">
      <header className="app-header">
        <div className="header-left">
          <h1><i className="fas fa-truck"></i> Overons</h1>
        </div>
        <div className="header-center">
          <nav className="nav-tabs">
            <button className={`nav-btn ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
              <i className="fas fa-chart-bar"></i> Dashboard
            </button>
            <button className={`nav-btn ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
              <i className="fas fa-file-alt"></i> Relatórios
            </button>
          </nav>
        </div>
        <div className="header-right">
          <div className={`conn-status ${connected ? 'online' : 'offline'}`}>
            <span className="conn-dot"></span> {connected ? 'Conectado' : 'Desconectado'}
          </div>
          <DarkModeToggle />
        </div>
      </header>

      <main className="app-main">
        {tab === 'dashboard' && (
          <>
            {/* Seção 1: KPIs */}
            <KpiCards socket={socket} />

            {/* Gamificação: Top 3 */}
            <Top3 />

            {/* Seção 2: Mapa + Alertas lado a lado */}
            <div className="map-alerts-row">
              <div className="map-container">
                <h3 className="section-title"><i className="fas fa-map-marked-alt"></i> Mapa ao Vivo</h3>
                <HeatMap drivers={drivers} />
              </div>
              <div className="alerts-container">
                <h3 className="section-title"><i className="fas fa-bell"></i> Alertas Proativos</h3>
                <AlertsPanel />
              </div>
            </div>

            {/* Seção 4: Ranking */}
            <div className="section-card">
              <h3 className="section-title"><i className="fas fa-trophy"></i> Ranking de Entregadores</h3>
              <RankingTable />
            </div>

            {/* Seção 5: Gráficos */}
            <div className="section-card">
              <h3 className="section-title"><i className="fas fa-chart-line"></i> Gráficos Analíticos</h3>
              <ChartsSection />
            </div>
          </>
        )}

        {tab === 'reports' && (
          <div className="section-card">
            <h3 className="section-title"><i className="fas fa-file-alt"></i> Relatórios</h3>
            <ReportsPanel />
          </div>
        )}
      </main>
    </div>
  );
}
