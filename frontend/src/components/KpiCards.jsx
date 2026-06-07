import { useEffect, useState } from 'react';
import { api } from '../hooks/useApi';
import './KpiCards.css';

const CARD_CONFIG = [
  { key: 'entregasHoje', icon: '📦', label: 'Entregas Hoje', suffix: '' },
  { key: 'taxaPontualidade', icon: '⏱️', label: 'Pontualidade', suffix: '%' },
  { key: 'sucessoPrimeiraTentativa', icon: '🎯', label: 'Sucesso 1ª Tentativa', suffix: '%' },
  { key: 'eficienciaMedia', icon: '⛽', label: 'Eficiência Média', suffix: ' km/L' },
];

export default function KpiCards({ socket }) {
  const [kpis, setKpis] = useState(null);

  const fetch = () => {
    api('/api/kpis').then(setKpis).catch(console.error);
  };

  useEffect(() => { fetch(); const id = setInterval(fetch, 10000); return () => clearInterval(id); }, []);

  if (!kpis) return <div className="kpi-grid"><div className="kpi-skeleton">Carregando...</div></div>;

  return (
    <div className="kpi-grid">
      {CARD_CONFIG.map(c => {
        const data = kpis[c.key];
        const val = data?.valor ?? 0;
        const vs = data?.vsOntem;
        const diff = vs !== undefined;
        const melhorou = diff && parseFloat(vs) > 0;

        return (
          <div key={c.key} className={`kpi-card ${diff ? (melhorou ? 'up' : 'down') : ''}`}>
            <div className="kpi-icon">{c.icon}</div>
            <div className="kpi-value">{typeof val === 'number' ? val.toLocaleString() : val}{c.suffix}</div>
            <div className="kpi-label">{c.label}</div>
            {diff && (
              <div className={`kpi-vs ${melhorou ? 'up' : 'down'}`}>
                {melhorou ? '▲' : '▼'} {Math.abs(parseFloat(vs)).toFixed(1)}% vs ontem
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
