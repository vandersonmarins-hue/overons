import { useEffect, useState } from 'react';
import { api } from '../hooks/useApi';
import './AlertsPanel.css';

const ICONS = {
  desvio_rota: '🚨', alta_ociosidade: '⛽', falha_tentativa: '📦',
  sla_estourando: '⚠️', geofence: '📍',
};

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api('/api/alerts').then(setAlerts).catch(console.error);
    const id = setInterval(() => api('/api/alerts').then(setAlerts).catch(() => {}), 15000);
    return () => clearInterval(id);
  }, []);

  if (!alerts.length) return <div className="alerts-empty">📬 Nenhum alerta no momento</div>;

  return (
    <div className="alerts-list">
      {alerts.map(a => (
        <div key={a.id} className={`alert-item ${a.gravidade}`}>
          <span className="alert-icon">{ICONS[a.tipo] || '🔔'}</span>
          <span className="alert-msg">{a.mensagem}</span>
          <span className="alert-time">{new Date(a.criada_em).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}
