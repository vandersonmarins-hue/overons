import { useEffect, useState } from 'react';
import { api } from '../hooks/useApi';
import './ReportsPanel.css';

const RELATORIOS = [
  { key: 'cpm', label: '💰 CPM' },
  { key: 'pagamentos', label: '💵 Pagamentos' },
  { key: 'ociosidade', label: '⏳ Ociosidade' },
  { key: 'sucesso-rota', label: '🎯 Sucesso' },
  { key: 'performance-temporal', label: '📈 Performance' },
  { key: 'carbono', label: '🌱 Carbono' },
];

export default function ReportsPanel() {
  const [activeReport, setActiveReport] = useState(RELATORIOS[0].key);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState('mes');

  const loadData = (key, p) => {
    setLoading(true);
    setData(null);
    api(`/api/reports/${key}?periodo=${p}`)
      .then(setData).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(activeReport, periodo); }, [activeReport, periodo]);

  const exportCSV = () => {
    if (!data) return;
    const rows = Array.isArray(data) ? data : [data];
    if (!rows.length) return;
    const headers = Object.keys(rows[0]).join(',');
    const csv = rows.map(r => Object.values(r).map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + headers + '\n' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `relatorio_${activeReport}.csv`; a.click();
  };

  return (
    <div className="r-panel">
      {/* Abas de relatorios */}
      <div className="r-tabs">
        {RELATORIOS.map(r => (
          <button key={r.key} className={`r-tab ${activeReport === r.key ? 'active' : ''}`}
            onClick={() => setActiveReport(r.key)}>{r.label}</button>
        ))}
      </div>

      {/* Filtros */}
      <div className="r-toolbar">
        <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="r-select">
          <option value="dia">Hoje</option>
          <option value="semana">Esta Semana</option>
          <option value="mes">Este Mês</option>
          <option value="ano">Este Ano</option>
        </select>
        <button className="r-export" onClick={exportCSV}><i className="fas fa-download"></i> CSV</button>
      </div>

      {/* Conteudo */}
      <div className="r-body">
        {loading && <div className="r-empty">📊 Carregando...</div>}
        {!loading && data && <RenderReport data={data} type={activeReport} />}
        {!loading && !data && <div className="r-empty">🔍 Selecione um relatório</div>}
      </div>
    </div>
  );
}

// ===== HELPERS =====
function fmt(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return String(val);
}

function fmtInt(val) {
  if (val === null || val === undefined) return '—';
  return Number(val).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

// ===== RENDERIZADORES =====

function RenderReport({ data, type }) {

  // --- CPM ---
  if (type === 'cpm' && data && data.custo_total !== undefined) {
    return (
      <div>
        <div className="r-hero"><span className="r-hero-num">R$ {fmt(data.cpm)}</span><span className="r-hero-label">Custo por KM rodado</span></div>
        <div className="r-cards">
          <div className="r-card"><span className="r-card-num">R$ {fmtInt(data.custo_combustivel)}</span><span className="r-card-label">⛽ Combustível</span></div>
          <div className="r-card"><span className="r-card-num">R$ {fmtInt(data.custo_manutencao)}</span><span className="r-card-label">🔧 Manutenção</span></div>
          <div className="r-card"><span className="r-card-num">R$ {fmtInt(data.custo_total)}</span><span className="r-card-label">💰 Custo Total</span></div>
          <div className="r-card"><span className="r-card-num">{fmtInt(data.km_total)} km</span><span className="r-card-label">📏 KM Rodado</span></div>
        </div>
      </div>
    );
  }

  // --- OCIOSIDADE ---
  if (type === 'ociosidade' && Array.isArray(data)) {
    const totalHoras = data.reduce((s, v) => s + parseFloat(v.horas_ociosas || 0), 0);
    return (
      <div>
        <div className="r-hero"><span className="r-hero-num">{totalHoras.toFixed(1)}h</span><span className="r-hero-label">⏳ Tempo Ocioso Total</span></div>
        <table className="r-table">
          <thead><tr><th>Veículo</th><th>Placa</th><th>Ociosidade</th><th>Combustível</th><th>Desperdício</th></tr></thead>
          <tbody>
            {data.map((v, i) => (
              <tr key={i}>
                <td><b>{v.modelo}</b></td>
                <td style={{color:'var(--text-muted)'}}>{v.placa}</td>
                <td><span className="r-badge warn">{parseFloat(v.horas_ociosas).toFixed(1)}h</span></td>
                <td>R$ {fmt(v.custo_combustivel)}</td>
                <td><span className="r-badge danger">R$ {fmt(v.custo_desperdicio)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // --- SUCESSO ROTA ---
  if (type === 'sucesso-rota' && Array.isArray(data)) {
    const mediaGeral = data.length > 0 ? data.reduce((s, v) => s + (v.taxa_sucesso || 0), 0) / data.length : 0;
    return (
      <div>
        <div className="r-hero"><span className="r-hero-num">{mediaGeral.toFixed(0)}%</span><span className="r-hero-label">🎯 Média Sucesso 1ª Tentativa</span></div>
        <table className="r-table">
          <thead><tr><th>Rota</th><th>Tentativas</th><th>Sucesso 1ª</th><th>%</th><th></th></tr></thead>
          <tbody>
            {data.map((r, i) => {
              const pct = r.taxa_sucesso || 0;
              return (
                <tr key={i}>
                  <td><b>📍 {r.endereco}</b></td>
                  <td>{r.total_tentativas}</td>
                  <td>{r.sucessos_1a}</td>
                  <td><b>{pct.toFixed(1)}%</b></td>
                  <td><span className={`r-badge ${pct >= 80 ? 'ok' : pct >= 60 ? 'warn' : 'fail'}`}>{pct >= 80 ? '✅' : pct >= 60 ? '⚠️' : '🔴'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // --- PERFORMANCE ---
  if (type === 'performance-temporal' && data) {
    return (
      <div>
        <h4 className="r-subtitle">📊 KM por Período</h4>
        <div className="r-cards">
          <div className="r-card"><span className="r-card-num">{fmtInt(data.kmPorDia?.km || 0)} km</span><span className="r-card-label">📆 Dia</span>{(data.kmPorDia?.variacao || 0) !== 0 && <span className={`r-card-vs ${(data.kmPorDia?.variacao || 0) > 0 ? 'up' : 'down'}`}>{(data.kmPorDia?.variacao || 0) > 0 ? '▲' : '▼'} {Math.abs(data.kmPorDia?.variacao || 0)}%</span>}</div>
          <div className="r-card"><span className="r-card-num">{fmtInt(data.kmPorMes?.km || 0)} km</span><span className="r-card-label">📆 Mês</span>{(data.kmPorMes?.variacao || 0) !== 0 && <span className={`r-card-vs ${(data.kmPorMes?.variacao || 0) > 0 ? 'up' : 'down'}`}>{(data.kmPorMes?.variacao || 0) > 0 ? '▲' : '▼'} {Math.abs(data.kmPorMes?.variacao || 0)}%</span>}</div>
          <div className="r-card"><span className="r-card-num">{fmtInt(data.kmPorAno?.km || 0)} km</span><span className="r-card-label">📆 Ano</span>{(data.kmPorAno?.variacao || 0) !== 0 && <span className={`r-card-vs ${(data.kmPorAno?.variacao || 0) > 0 ? 'up' : 'down'}`}>{(data.kmPorAno?.variacao || 0) > 0 ? '▲' : '▼'} {Math.abs(data.kmPorAno?.variacao || 0)}%</span>}</div>
          <div className="r-card"><span className="r-card-num">{data.tempoMedio?.minutos ? data.tempoMedio.minutos + ' min' : '—'}</span><span className="r-card-label">⏱️ Tempo Médio</span></div>
        </div>
        <div className="r-formula">📐 <b>Total acumulado no ano:</b> {fmtInt(data.kmPorAno?.acumulado || 0)} km</div>
      </div>
    );
  }

  // --- PAGAMENTOS ---
  if (type === 'pagamentos' && data && data.totalGeral) {
    return (
      <div>
        <div className="r-hero"><span className="r-hero-num">R$ {fmtInt(data.periodoAtual?.totalPago || 0)}</span><span className="r-hero-label">💵 Total pago no período</span></div>
        
        <div className="r-cards">
          <div className="r-card"><span className="r-card-num">{data.periodoAtual?.entregas || 0}</span><span className="r-card-label">📦 Entregas no período</span></div>
          <div className="r-card"><span className="r-card-num">R$ {fmt(data.periodoAtual?.ticketMedio || 0)}</span><span className="r-card-label">🎫 Ticket médio</span></div>
          <div className="r-card"><span className="r-card-num">R$ {fmt(data.periodoAtual?.mediaPorDia || 0)}</span><span className="r-card-label">📊 Média por dia</span></div>
          <div className="r-card"><span className="r-card-num">R$ {fmtInt(data.totalGeral?.totalPago || 0)}</span><span className="r-card-label">💰 Total geral (histórico)</span></div>
        </div>

        {/* Acumulado por mês */}
        {data.porMes && data.porMes.length > 0 && (
          <div style={{marginTop:14}}>
            <h4 className="r-subtitle">📅 Acumulado por Mês</h4>
            <table className="r-table">
              <thead><tr><th>Mês</th><th>Entregas</th><th>Total Pago</th><th>Ticket Médio</th></tr></thead>
              <tbody>
                {data.porMes.map((m, i) => (
                  <tr key={i}>
                    <td><b>{m.mes}</b></td>
                    <td>{m.entregas}</td>
                    <td><b style={{color:'var(--accent)'}}>R$ {fmtInt(m.total)}</b></td>
                    <td>R$ {m.ticketMedio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Por entregador */}
        {data.porEntregador && data.porEntregador.length > 0 && (
          <div style={{marginTop:14}}>
            <h4 className="r-subtitle">👤 Pagamento por Entregador</h4>
            <table className="r-table">
              <thead><tr><th>Entregador</th><th>Entregas</th><th>Total Pago</th></tr></thead>
              <tbody>
                {data.porEntregador.map((e, i) => (
                  <tr key={i}>
                    <td><b>{e.nome}</b></td>
                    <td>{e.entregas}</td>
                    <td><b style={{color:'var(--accent)'}}>R$ {fmtInt(e.totalPago)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // --- CARBONO ---
  if (type === 'carbono' && data && data.co2 !== undefined) {
    return (
      <div>
        <div className="r-hero" style={{borderTop: '3px solid #00b894'}}>
          <span className="r-hero-num">{fmt(data.co2)} kg</span>
          <span className="r-hero-label">🌱 CO₂ emitido no período</span>
        </div>
        <div className="r-cards">
          <div className="r-card"><span className="r-card-num">{fmtInt(data.kmTotal)} km</span><span className="r-card-label">📏 KM Rodado</span></div>
          <div className="r-card"><span className="r-card-num">{data.arvores || 0}</span><span className="r-card-label">🌳 Árvores p/ compensar</span></div>
          <div className="r-card"><span className="r-card-num">{(data.co2 / 1000).toFixed(2)} t</span><span className="r-card-label">📦 Toneladas CO₂</span></div>
          <div className="r-card"><span className="r-card-num">{data.co2 && data.kmTotal ? (data.co2 / data.kmTotal * 1000).toFixed(1) : '—'} g/km</span><span className="r-card-label">🔬 Emissão por KM</span></div>
        </div>
        <div className="r-formula">📐 <b>Cálculo:</b> {fmtInt(data.kmTotal)} km × 0.12 kg CO₂/km = {fmt(data.co2)} kg CO₂</div>
      </div>
    );
  }

  // Fallback
  const arr = Array.isArray(data) ? data : [data];
  if (!arr.length) return <div className="r-empty">Nenhum dado</div>;
  const keys = Object.keys(arr[0]);
  return (
    <table className="r-table">
      <thead><tr>{keys.map(k => <th key={k}>{k}</th>)}</tr></thead>
      <tbody>{arr.map((row, i) => <tr key={i}>{keys.map(k => <td key={k}>{String(row[k] ?? '')}</td>)}</tr>)}</tbody>
    </table>
  );
}
