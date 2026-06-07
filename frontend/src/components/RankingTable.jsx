import { useEffect, useState } from 'react';
import { api } from '../hooks/useApi';
import './RankingTable.css';

export default function RankingTable() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    api('/api/ranking').then(setRanking).catch(console.error);
    const id = setInterval(() => api('/api/ranking').then(setRanking).catch(() => {}), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ranking-wrap">
      <table className="ranking-table">
        <thead>
          <tr>
            <th>#</th><th>Entregador</th><th>Entregas Hoje</th>
            <th>Sucesso 1ª Tent</th><th>Pontualidade</th><th>Eficiência</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.id}>
              <td className="rank-num">{i + 1}</td>
              <td><strong>{r.nome || r.id}</strong></td>
              <td>{r.entregasHoje}</td>
              <td>{r.sucessoPrimeiraTentativa || '—'}%</td>
              <td><span className={`ponto-badge ${(r.pontualidade || 0) >= 80 ? 'verde' : (r.pontualidade || 0) >= 60 ? 'amarelo' : 'vermelho'}`}>{r.pontualidade || '—'}%</span></td>
              <td>{r.eficiencia || '—'} km/L</td>
            </tr>
          ))}
          {ranking.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 20 }}>Nenhum dado</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
