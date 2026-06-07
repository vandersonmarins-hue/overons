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

function saveFilters(f) { localStorage.setItem(LS_KEY, JSON.stringify(f)); }

export default function ReportsPanel() {
  const [activeReport, setActiveReport] = useState(RELATORIOS[0].key);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(loadFilters);

  useEffect(() => { saveFilters(filters); }, [filters]);

  useEffect(() => {
    setLoading(true);
    setData(null);
    api(`/api/reports/${activeReport}?periodo=${filters.periodo}`)
      .then(setData).catch(console.error)
      .finally(() => setLoading(false));
  }, [activeReport, filters.periodo]);

  const exportCSV = () => {
    if (!data) return;
    const BOM = '\uFEFF';
    const rows = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0] || {}).join(',');
    const csv = rows.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([BOM + headers + '\n' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `relatorio_${activeReport}.csv`; a.click();
    URL.revokeObjectURL(a.href);
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
          <select value={filters.periodo} onChange={e => setFilters(p => ({ ...p, periodo: e.target.value }))} className="report-select">
            <option value="dia">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="ano">Este Ano</option>
          </select>
          <button className="btn-export" onClick={exportCSV}><i className="fas fa-download"></i> Exportar CSV</button>
        </div>
        <div className="report-data">
          {loading && <div className="report-loading">📊 Carregando relatório...</div>}
          {!loading && data && <RenderReport data={data} type={activeReport} />}
          {!loading && !data && <div className="report-empty">🔍 Selecione um relatório ao lado</div>}
        </div>
      </div>
    </div>
  );
}

function fmt(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return String(val);
}

function fmtInt(val) {
  if (val === null || val === undefined) return '—';
  return Number(val).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

function ShowTable({ data, cols }) {
  const arr = Array.isArray(data) ? data : [data];
  if (!arr.length) return <div className="report-empty">Nenhum dado disponível</div>;

  const headers = cols || Object.keys(arr[0]);

  return (
    <div className="report-table-wrap">
      <table className="report-table">
        <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {arr.map((row, i) => (
            <tr key={i}>{headers.map(h => {
              const key = Object.keys(row).find(k => k.toLowerCase() === h.toLowerCase().replace(/\s/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
              const val = key ? row[key] : row[h];
              return <td key={h}>{fmt(val)}</td>;
            })}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RenderReport({ data, type }) {
  // ===== CPM =====
  if (type === 'cpm' && data.custo_total !== undefined) {
    return (
      <div className="r-cpm">
        <div className="report-hero">
          <span className="hero-num">R$ {fmt(data.cpm)}</span>
          <span className="hero-label">Custo por KM rodado</span>
        </div>
        <div className="r-grid">
          <div className="r-card"><span className="r-card-num">R$ {fmtInt(data.custo_combustivel)}</span><span className="r-card-label">⛽ Combustível</span></div>
          <div className="r-card"><span className="r-card-num">R$ {fmtInt(data.custo_manutencao)}</span><span className="r-card-label">🔧 Manutenção</span></div>
          <div className="r-card"><span className="r-card-num">R$ {fmtInt(data.custo_total)}</span><span className="r-card-label">💰 Custo Total</span></div>
          <div className="r-card"><span className="r-card-num">{fmtInt(data.km_total)} km</span><span className="r-card-label">📏 KM Total Rodado</span></div>
        </div>
      </div>
    );
  }

  // ===== OCIOSIDADE =====
  if (type === 'ociosidade' && Array.isArray(data)) {
    return (
      <div>
        <div className="report-hero" style={{marginBottom:16}}>
          <span className="hero-num">{data.reduce((s, v) => s + parseFloat(v.horas_ociosas || 0), 0).toFixed(1)}h</span>
          <span className="hero-label">⏳ Tempo Ocioso Total no Período</span>
        </div>
        <div className="report-table-wrap">
          <table className="report-table">
            <thead><tr><th>Veículo</th><th>Placa</th><th>Tempo Ocioso</th><th>Combustível</th><th>Custo Desperdício</th></tr></thead>
            <tbody>
              {data.map((v, i) => (
                <tr key={i}>
                  <td><strong>{v.modelo}</strong></td>
                  <td>{v.placa}</td>
                  <td><span className="badge-alert">{parseFloat(v.horas_ociosas).toFixed(1)}h</span></td>
                  <td>R$ {fmt(v.custo_combustivel)}</td>
                  <td><span className="badge-danger">R$ {fmt(v.custo_desperdicio)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ===== SUCESSO POR ROTA =====
  if (type === 'sucesso-rota' && Array.isArray(data)) {
    return (
      <div>
        <div className="report-hero" style={{marginBottom:16}}>
          <span className="hero-num">{data.length > 0 ? Math.round(data.reduce((s, v) => s + (v.taxa_sucesso || 0), 0) / data.length) : 0}%</span>
          <span className="hero-label">🎯 Média de Sucesso na 1ª Tentativa</span>
        </div>
        <div className="report-table-wrap">
          <table className="report-table">
            <thead><tr><th>Rota / Endereço</th><th>Tentativas</th><th>Sucesso 1ª</th><th>% Sucesso</th><th>Status</th></tr></thead>
            <tbody>
              {data.map((r, i) => {
                const pct = r.taxa_sucesso || 0;
                return (
                  <tr key={i}>
                    <td><strong>📍 {r.endereco}</strong></td>
                    <td>{r.total_tentativas}</td>
                    <td>{r.sucessos_1a}</td>
                    <td><b>{pct.toFixed(1)}%</b></td>
                    <td><span className={`badge ${pct >= 80 ? 'ok' : pct >= 60 ? 'warn' : 'fail'}`}>{pct >= 80 ? '✅ Boa' : pct >= 60 ? '⚠️ Média' : '🔴 Ruim'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ===== PERFORMANCE TEMPORAL =====
  if (type === 'performance-temporal' && data) {
    return (
      <div>
        <h4 style={{color:'var(--text)',marginBottom:12,fontSize:14}}>📈 Comparativo por Período</h4>
        <div className="r-grid" style={{marginBottom:16}}>
          <div className="r-card"><span className="r-card-num">{fmtInt(data.kmPorDia?.km || 0)} km</span><span className="r-card-label">📆 KM no Dia</span><span className={`r-card-vs ${(data.kmPorDia?.variacao || 0) > 0 ? 'up' : 'down'}`}>vs período anterior {(data.kmPorDia?.variacao || 0) > 0 ? '▲' : '▼'} {Math.abs(data.kmPorDia?.variacao || 0)}%</span></div>
          <div className="r-card"><span className="r-card-num">{fmtInt(data.kmPorDia?.acumulado || 0)} km</span><span className="r-card-label">📊 Acumulado no Dia</span></div>
          <div className="r-card"><span className="r-card-num">{fmtInt(data.kmPorMes?.km || 0)} km</span><span className="r-card-label">📆 KM no Mês</span><span className={`r-card-vs ${(data.kmPorMes?.variacao || 0) > 0 ? 'up' : 'down'}`}>vs período anterior {(data.kmPorMes?.variacao || 0) > 0 ? '▲' : '▼'} {Math.abs(data.kmPorMes?.variacao || 0)}%</span></div>
          <div className="r-card"><span className="r-card-num">{fmtInt(data.kmPorMes?.acumulado || 0)} km</span><span className="r-card-label">📊 Acumulado no Mês</span></div>
          <div className="r-card"><span className="r-card-num">{fmtInt(data.kmPorAno?.km || 0)} km</span><span className="r-card-label">📆 KM no Ano</span><span className={`r-card-vs ${(data.kmPorAno?.variacao || 0) > 0 ? 'up' : 'down'}`}>vs período anterior {(data.kmPorAno?.variacao || 0) > 0 ? '▲' : '▼'} {Math.abs(data.kmPorAno?.variacao || 0)}%</span></div>
          <div className="r-card"><span className="r-card-num">{fmtInt(data.kmPorAno?.acumulado || 0)} km</span><span className="r-card-label">📊 Acumulado no Ano</span></div>
        </div>
        <div className="r-table-section" style={{marginTop:16}}>
          <h4 style={{color:'var(--text)',marginBottom:8,fontSize:14}}>⏱️ Tempo Médio de Entrega</h4>
          <div className="r-grid" style={{gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))'}}>
            <div className="r-card"><span className="r-card-num">{data.tempoMedio?.minutos || '—'} min</span><span className="r-card-label">Tempo médio</span></div>
            <div className="r-card"><span className="r-card-num">{data.tempoMedio?.totalEntregas || 0}</span><span className="r-card-label">Total entregas</span></div>
          </div>
        </div>
      </div>
    );
  }

  // ===== CARBONO =====
  if (type === 'carbono' && data && data.co2 !== undefined) {
    return (
      <div>
        <div className="report-hero">
          <span className="hero-num">{fmt(data.co2)} kg</span>
          <span className="hero-label">🌱 CO₂ emitido no período</span>
        </div>
        <div className="r-grid">
          <div className="r-card carbon"><span className="r-card-num">{fmtInt(data.kmTotal)} km</span><span className="r-card-label">📏 KM Total Rodado</span></div>
          <div className="r-card carbon"><span className="r-card-num">{data.arvores || 0}</span><span className="r-card-label">🌳 Árvores para compensar</span></div>
          <div className="r-card carbon"><span className="r-card-num">{(data.co2 / 1000).toFixed(2)} t</span><span className="r-card-label">📦 Toneladas de CO₂</span></div>
          <div className="r-card carbon"><span className="r-card-num">{data.co2 && data.kmTotal ? (data.co2 / data.kmTotal * 1000).toFixed(1) : '—'} g/km</span><span className="r-card-label">🔬 Emissão por KM</span></div>
        </div>
        <div className="r-formula">
          📐 <b>Fórmula:</b> {fmtInt(data.kmTotal)} km × 0.12 kg CO₂/km = {fmt(data.co2)} kg CO₂
        </div>
      </div>
    );
  }

  // ===== FALLBACK: GENERIC TABLE =====
  const arr = Array.isArray(data) ? data : [data];
  return <ShowTable data={arr} />;
}
