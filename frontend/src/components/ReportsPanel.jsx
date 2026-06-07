import { useEffect, useState } from 'react';
import { api } from '../hooks/useApi';
import './ReportsPanel.css';

const RELATORIOS = [
  { key: 'cpm', label: '💰 Custo por Quilômetro (CPM)' },
  { key: 'ociosidade', label: '⏳ Relatório de Ociosidade' },
  { key: 'sucesso-rota', label: '🎯 Taxa de Sucesso por Rota' },
  { key: 'performance-temporal', label: '📈 Performance Temporal' },
  { key: 'carbono', label: '🌱 Pegada de Carbono (ESG)' },
];

const LS_KEY = 'overons_report_filters';

function loadFilters() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || { periodo: 'mes' }; }
  catch { return { periodo: 'mes' }; }
}

function saveFilters(f) {
  localStorage.setItem(LS_KEY, JSON.stringify(f));
}

export default function ReportsPanel() {
  const [activeReport, setActiveReport] = useState(RELATORIOS[0].key);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(loadFilters);

  useEffect(() => { saveFilters(filters); }, [filters]);

  useEffect(() => {
    setLoading(true);
    api(`/api/reports/${activeReport}?periodo=${filters.periodo}`)
      .then(setData).catch(console.error)
      .finally(() => setLoading(false));
  }, [activeReport, filters.periodo]);

  const exportCSV = () => {
    if (!data) return;
    const BOM = '\uFEFF';
    const rows = Array.isArray(data) ? data : [data];
    const headers = Object.keys(rows[0] || {}).join(',');
    const csv = rows.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([BOM + headers + '\n' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `relatorio_${activeReport}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-container">
      <div className="reports-sidebar">
        <h4>Relatórios</h4>
        {RELATORIOS.map(r => (
          <button key={r.key} className={`report-btn ${activeReport === r.key ? 'active' : ''}`}
            onClick={() => setActiveReport(r.key)}>{r.label}</button>
        ))}
      </div>
      <div className="reports-content">
        <div className="reports-toolbar">
          <select value={filters.periodo} onChange={e => setFilters(p => ({ ...p, periodo: e.target.value }))}
            className="report-select">
            <option value="dia">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="ano">Este Ano</option>
          </select>
          <button className="btn-export" onClick={exportCSV}><i className="fas fa-download"></i> Exportar CSV</button>
        </div>
        <div className="report-data">
          {loading && <div className="report-loading">Carregando...</div>}
          {!loading && data && <RenderReport data={data} type={activeReport} />}
          {!loading && !data && <div className="report-empty">Selecione um relatório</div>}
        </div>
      </div>
    </div>
  );
}

function RenderReport({ data, type }) {
  const arr = Array.isArray(data) ? data : [data];

  if (type === 'carbono' && data.co2) {
    return (
      <div className="report-carbon">
        <div className="carbon-card">
          <div className="carbon-num">{data.co2.toFixed(1)} kg</div>
          <div className="carbon-label">CO₂ emitido no período</div>
        </div>
        <div className="carbon-card">
          <div className="carbon-num">{data.arvores || 0}</div>
          <div className="carbon-label">🌳 Árvores necessárias para compensar</div>
        </div>
        <div className="carbon-card">
          <div className="carbon-num">{data.kmTotal?.toFixed(0) || 0} km</div>
          <div className="carbon-label">📏 Total rodado</div>
        </div>
        <p style={{ color: '#888', fontSize: 13, marginTop: 12 }}>Cálculo: {data.kmTotal?.toFixed(0) || 0} km × 0.12 kg CO₂/km</p>
      </div>
    );
  }

  if (type === 'performance-temporal' && data.kmPorDia) {
    return (
      <div className="report-table-wrap">
        <h4>📊 KM por Período</h4>
        <table className="report-table">
          <thead><tr><th>Período</th><th>KM</th><th>Acumulado</th><th>Comparativo</th></tr></thead>
          <tbody>
            <tr><td>Dia</td><td>{data.kmPorDia?.km || 0}</td><td>{data.kmPorDia?.acumulado || 0}</td>
              <td><span className={data.kmPorDia?.variacao > 0 ? 'up' : 'down'}>{data.kmPorDia?.variacao > 0 ? '▲' : '▼'} {Math.abs(data.kmPorDia?.variacao || 0)}%</span></td></tr>
            <tr><td>Mês</td><td>{data.kmPorMes?.km || 0}</td><td>{data.kmPorMes?.acumulado || 0}</td>
              <td><span className={data.kmPorMes?.variacao > 0 ? 'up' : 'down'}>{data.kmPorMes?.variacao > 0 ? '▲' : '▼'} {Math.abs(data.kmPorMes?.variacao || 0)}%</span></td></tr>
            <tr><td>Ano</td><td>{data.kmPorAno?.km || 0}</td><td>{data.kmPorAno?.acumulado || 0}</td>
              <td><span className={data.kmPorAno?.variacao > 0 ? 'up' : 'down'}>{data.kmPorAno?.variacao > 0 ? '▲' : '▼'} {Math.abs(data.kmPorAno?.variacao || 0)}%</span></td></tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="report-table-wrap">
      <table className="report-table">
        <thead>
          <tr>{Object.keys(arr[0] || {}).map(k => <th key={k}>{k}</th>)}</tr>
        </thead>
        <tbody>
          {arr.map((row, i) => (
            <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{String(v ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
