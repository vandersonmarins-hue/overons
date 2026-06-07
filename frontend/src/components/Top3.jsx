import { useEffect, useState } from 'react';
import { api } from '../hooks/useApi';
import './Top3.css';

export default function Top3() {
  const [top, setTop] = useState([]);

  useEffect(() => {
    api('/api/top3').then(setTop).catch(console.error);
  }, []);

  if (!top.length) return null;

  const SELOS = { ouro: ['🥇', '#ffd700'], prata: ['🥈', '#c0c0c0'], bronze: ['🥉', '#cd7f32'] };

  return (
    <div className="top3-section">
      <h4 className="top3-title">🏆 Top 3 Entregadores do Mês</h4>
      <div className="top3-grid">
        {top.map((e, i) => {
          const [selo, cor] = SELOS[e.selo] || ['🏅', '#888'];
          return (
            <div key={e.id} className={`top3-card ${e.selo}`} style={{ '--selo-color': cor }}>
              <div className="top3-medal">{selo}</div>
              <div className="top3-nome">{e.nome || e.id}</div>
              <div className="top3-score">{e.score_geral?.toFixed(0) || 0} pts</div>
              <div className="top3-stats">
                <span>📦 {e.total_entregas}</span>
                <span>⭐ {e.avaliacao_media_cliente?.toFixed(1) || '—'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
