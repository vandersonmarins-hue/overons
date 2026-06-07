const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const path = require('path');

// Middleware para JSON
app.use(express.json());

// CORS para React dev server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve arquivos estaticos
app.use(express.static(path.join(__dirname, '..')));

// ==================== DATABASE ====================
const { initDatabase, getDb } = require('./database');
let db;

// Schema SQL (migracoes)
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, nome TEXT NOT NULL, cnpj TEXT UNIQUE NOT NULL, responsavel TEXT NOT NULL, email TEXT NOT NULL, telefone TEXT, plano TEXT DEFAULT 'basico', status TEXT DEFAULT 'trial', max_entregadores INTEGER DEFAULT 10, max_veiculos INTEGER DEFAULT 5, logo_url TEXT, criada_em TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS subscriptions (id TEXT PRIMARY KEY, empresa_id TEXT NOT NULL, plano TEXT NOT NULL, valor REAL NOT NULL DEFAULT 0, data_inicio TEXT NOT NULL, data_vencimento TEXT NOT NULL, data_cancelamento TEXT, status TEXT DEFAULT 'ativa');
CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, empresa_id TEXT NOT NULL, subscription_id TEXT, valor REAL NOT NULL, data_pagamento TEXT, data_vencimento TEXT NOT NULL, metodo TEXT DEFAULT 'pix', status TEXT DEFAULT 'pendente', comprovante_url TEXT, observacao TEXT, pago_em TEXT);
CREATE TABLE IF NOT EXISTS entregadores (id TEXT PRIMARY KEY, empresa_id TEXT NOT NULL DEFAULT 'EMP_001', nome TEXT NOT NULL, telefone TEXT, veiculo_id TEXT, status TEXT DEFAULT 'offline', cadastro_em TEXT DEFAULT (datetime('now')), foto_url TEXT);
CREATE TABLE IF NOT EXISTS veiculos (id TEXT PRIMARY KEY, empresa_id TEXT NOT NULL DEFAULT 'EMP_001', placa TEXT UNIQUE, modelo TEXT, ano INTEGER, capacidade_kg REAL DEFAULT 0, tipo_combustivel TEXT DEFAULT 'gasolina', consumo_medio_km_por_litro REAL DEFAULT 10.0, ativo INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS deliveries (id TEXT PRIMARY KEY, empresa_id TEXT NOT NULL DEFAULT 'EMP_001', entregador_id TEXT, veiculo_id TEXT, cliente_nome TEXT NOT NULL, endereco TEXT NOT NULL, lat REAL, lng REAL, destino_lat REAL, destino_lng REAL, distancia_km REAL DEFAULT 0, tempo_total_segundos INTEGER DEFAULT 0, tempo_ocioso_segundos INTEGER DEFAULT 0, consumo_combustivel_litros REAL DEFAULT 0, tentativa_unica INTEGER DEFAULT 1, status TEXT DEFAULT 'pendente', horario_previsto TEXT, horario_inicio TEXT, horario_fim TEXT, valor REAL DEFAULT 0, nota_cliente INTEGER DEFAULT 0, comprovante_foto_url TEXT, link_rastreamento TEXT, risco_atraso TEXT DEFAULT 'baixo', geofencing_entrada TEXT, geofencing_saida TEXT, criada_em TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS vehicle_logs (id TEXT PRIMARY KEY, empresa_id TEXT NOT NULL DEFAULT 'EMP_001', veiculo_id TEXT NOT NULL, data TEXT NOT NULL, km_inicial REAL DEFAULT 0, km_final REAL DEFAULT 0, km_rodado_dia REAL DEFAULT 0, horimetro_inicial REAL DEFAULT 0, horimetro_final REAL DEFAULT 0, tempo_ocioso_total_segundos INTEGER DEFAULT 0, custo_combustivel_dia REAL DEFAULT 0, custo_manutencao_dia REAL DEFAULT 0);
CREATE TABLE IF NOT EXISTS driver_scorecards (id TEXT PRIMARY KEY, empresa_id TEXT NOT NULL DEFAULT 'EMP_001', entregador_id TEXT NOT NULL, mes_ano TEXT NOT NULL, taxa_sucesso_primeira_tentativa REAL DEFAULT 0, pontualidade_media REAL DEFAULT 0, eficiencia_combustivel_km_por_litro REAL DEFAULT 0, avaliacao_media_cliente REAL DEFAULT 0, tempo_medio_parada_segundos INTEGER DEFAULT 0, total_entregas INTEGER DEFAULT 0, score_geral REAL DEFAULT 0, selo TEXT DEFAULT 'sem_selo');
CREATE TABLE IF NOT EXISTS alerts (id TEXT PRIMARY KEY, empresa_id TEXT NOT NULL DEFAULT 'EMP_001', tipo TEXT NOT NULL, entregador_id TEXT, mensagem TEXT NOT NULL, gravidade TEXT DEFAULT 'medio', lida INTEGER DEFAULT 0, criada_em TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS tracking_sessions (id TEXT PRIMARY KEY, delivery_id TEXT NOT NULL, token TEXT UNIQUE NOT NULL, status TEXT DEFAULT 'ativo', ultimo_acesso TEXT, criada_em TEXT DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_deliveries_empresa ON deliveries(empresa_id);
CREATE INDEX IF NOT EXISTS idx_entregadores_empresa ON entregadores(empresa_id);
`;

// ==================== WEBSOCKET ====================
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ==================== ARMAZENAMENTO EM MEMORIA (tempo real) ====================
const drivers = new Map();
const deliveries = [];
let globalEntregas = [];

// ==================== ROTAS PUBLICAS ====================

app.get('/', (req, res) => {
  res.send('Overons API - Servidor de rastreamento de entregadores');
});

// ==================== HELPER: FILTRO EMPRESA ====================
function empresaFilter(req) {
  const eid = req.query.empresa_id;
  if (!eid) return { sql: '', params: [] };
  return { sql: 'AND d.empresa_id = ?', params: [eid] };
}
function empresaFilterDeliveries(alias = 'd') {
  return function(req) {
    const eid = req.query.empresa_id;
    if (!eid) return { sql: '', params: [] };
    return { sql: `AND ${alias}.empresa_id = ?`, params: [eid] };
  };
}

// ==================== API: DASHBOARD KPIs ====================

app.get('/api/kpis', (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const entregasHoje = db.prepare("SELECT COUNT(*) as total FROM deliveries WHERE date(criada_em) = ? AND status = 'concluida'").get(hoje);
    const entregasOntem = db.prepare("SELECT COUNT(*) as total FROM deliveries WHERE date(criada_em) = ? AND status = 'concluida'").get(ontem);
    const totalHoje = db.prepare("SELECT COUNT(*) as total FROM deliveries WHERE date(criada_em) = ?").get(hoje);
    const tempoMedio = db.prepare(`
      SELECT AVG((julianday(horario_fim) - julianday(horario_inicio)) * 86400) as media 
      FROM deliveries WHERE date(criada_em) = ? AND status = 'concluida' AND horario_fim IS NOT NULL
    `).get(hoje);
    const sucesso1a = db.prepare(`
      SELECT 
        (CAST(SUM(CASE WHEN tentativa_unica = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*)) * 100 as taxa
      FROM deliveries WHERE date(criada_em) = ? AND status = 'concluida'
    `).get(hoje);
    const consumoDia = db.prepare(`
      SELECT 
        CASE WHEN SUM(km_rodado_dia) > 0 
          THEN SUM(km_rodado_dia) * 1.0 / NULLIF(SUM(custo_combustivel_dia), 0) 
          ELSE 0 END as eficiencia
      FROM vehicle_logs WHERE data = ?
    `).get(hoje);
    const motoristasOnline = db.prepare("SELECT COUNT(*) as total FROM entregadores WHERE status = 'online'").get();
    const motoristasTotal = db.prepare("SELECT COUNT(*) as total FROM entregadores").get();
    const emAndamento = db.prepare("SELECT COUNT(*) as total FROM deliveries WHERE status = 'em_andamento'").get();

    // Calcular atrasos (mock)
    const atrasados = db.prepare(`
      SELECT COUNT(*) as total FROM deliveries 
      WHERE date(criada_em) = ? AND status IN ('em_andamento','pendente')
        AND horario_previsto < datetime('now')
    `).get(hoje);

    const kpis = {
      entregasHoje: { valor: entregasHoje.total, vsOntem: entregasOntem.total > 0 ? ((entregasHoje.total - entregasOntem.total) / entregasOntem.total * 100).toFixed(1) : 0 },
      taxaPontualidade: { valor: tempoMedio.media ? Math.max(0, Math.min(100, 100 - (tempoMedio.media / 3600 - 1) * 20)).toFixed(1) : 85 },
      sucessoPrimeiraTentativa: { valor: sucesso1a.taxa ? sucesso1a.taxa.toFixed(1) : 82.5 },
      eficienciaMedia: { valor: consumoDia.eficiencia ? consumoDia.eficiencia.toFixed(2) : '10.50' },
      motoristasOnline: motoristasOnline.total,
      motoristasTotal: motoristasTotal.total,
      entregasEmAndamento: emAndamento.total,
      entregasAtrasadas: atrasados.total,
      totalHoje: totalHoje.total,
    };
    res.json(kpis);
  } catch (err) {
    console.error('Erro KPIs:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== API: RANKING ENTREGADORES ====================

app.get('/api/ranking', (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const ranking = db.prepare(`
      SELECT 
        e.id, e.nome, e.status,
        COUNT(d.id) as entregas_hoje,
        COALESCE(ROUND(AVG(CASE WHEN d.tentativa_unica = 1 THEN 100 ELSE 0 END), 1), 0) as sucesso_1a_tentativa,
        COALESCE(ROUND(AVG(CASE WHEN d.horario_fim <= d.horario_previsto THEN 100 ELSE 0 END), 1), 0) as pontualidade,
        COALESCE(ROUND(AVG(d.consumo_combustivel_litros), 2), 0) as consumo_medio,
        COALESCE(ROUND(AVG(d.nota_cliente), 1), 0) as avaliacao_media
      FROM entregadores e
      LEFT JOIN deliveries d ON d.entregador_id = e.id AND date(d.criada_em) = ? AND d.status = 'concluida'
      GROUP BY e.id
      ORDER BY entregas_hoje DESC
    `).all(hoje);
    res.json(ranking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== API: ALERTAS ====================

app.get('/api/alerts', (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT a.*, e.nome as entregador_nome 
      FROM alerts a 
      LEFT JOIN entregadores e ON a.entregador_id = e.id 
      ORDER BY a.criada_em DESC LIMIT 30
    `).all();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== API: HISTORICO DE ENTREGAS ====================

app.get('/api/deliveries/history', (req, res) => {
  try {
    const { dias = 30, entregador_id, status } = req.query;
    let sql = `SELECT d.*, e.nome as entregador_nome FROM deliveries d LEFT JOIN entregadores e ON d.entregador_id = e.id WHERE 1=1`;
    const params = [];

    if (dias) { sql += ` AND d.criada_em >= datetime('now', '-${parseInt(dias)} days')`; }
    if (entregador_id) { sql += ` AND d.entregador_id = ?`; params.push(entregador_id); }
    if (status) { sql += ` AND d.status = ?`; params.push(status); }

    sql += ` ORDER BY d.criada_em DESC LIMIT 200`;
    const data = db.prepare(sql).all(...params);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== API: GRAFICOS ====================

app.get('/api/charts/km-por-dia', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT data, SUM(km_rodado_dia) as km_total, SUM(custo_combustivel_dia) as custo_total
      FROM vehicle_logs GROUP BY data ORDER BY data ASC LIMIT 30
    `).all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/charts/eta-vs-realidade', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT date(criada_em) as dia,
        AVG((julianday(horario_previsto) - julianday(criada_em)) * 1440) as eta_medio_min,
        AVG((julianday(horario_fim) - julianday(horario_inicio)) * 1440) as tempo_real_min
      FROM deliveries WHERE status = 'concluida' AND horario_fim IS NOT NULL
      GROUP BY dia ORDER BY dia DESC LIMIT 15
    `).all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/charts/top-atrasos', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT e.nome, 
        COUNT(*) as total_entregas,
        SUM(CASE WHEN d.horario_fim > d.horario_previsto THEN 1 ELSE 0 END) as atrasos,
        ROUND(AVG(CASE WHEN d.horario_fim > d.horario_previsto 
          THEN (julianday(d.horario_fim) - julianday(d.horario_previsto)) * 1440 ELSE 0 END), 1) as atraso_medio_min
      FROM deliveries d JOIN entregadores e ON d.entregador_id = e.id
      WHERE d.status = 'concluida' AND d.horario_fim IS NOT NULL
      GROUP BY e.id
      ORDER BY atrasos DESC LIMIT 5
    `).all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== API: SCORECARDS (gamificacao) ====================

app.get('/api/scorecards', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT s.*, e.nome FROM driver_scorecards s
      JOIN entregadores e ON s.entregador_id = e.id
      ORDER BY s.mes_ano DESC, s.score_geral DESC
    `).all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/top3', (req, res) => {
  try {
    const hoje = new Date();
    const mesAno = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    
    const top3 = db.prepare(`
      SELECT s.*, e.nome FROM driver_scorecards s
      JOIN entregadores e ON s.entregador_id = e.id
      WHERE s.mes_ano = ?
      ORDER BY s.score_geral DESC LIMIT 3
    `).all(mesAno);

    const selos = ['🥇 Ouro', '🥈 Prata', '🥉 Bronze'];
    const resultado = top3.map((t, i) => ({
      ...t,
      selo_nome: selos[i] || '',
      posicao: i + 1,
    }));

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== API: RELATORIOS ====================

app.get('/api/reports/cpm', (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    let sql = `SELECT 
      SUM(custo_combustivel_dia) as custo_combustivel,
      SUM(custo_manutencao_dia) as custo_manutencao,
      SUM(km_rodado_dia) as km_total
      FROM vehicle_logs WHERE 1=1`;
    const params = [];
    if (data_inicio) { sql += ` AND data >= ?`; params.push(data_inicio); }
    if (data_fim) { sql += ` AND data <= ?`; params.push(data_fim); }
    
    const data = db.prepare(sql).get(...params);
    const custoTotal = (data.custo_combustivel || 0) + (data.custo_manutencao || 0);
    res.json({
      ...data,
      custo_total: custoTotal,
      cpm: data.km_total > 0 ? (custoTotal / data.km_total).toFixed(4) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/ociosidade', (req, res) => {
  try {
    const { data_inicio, data_fim } = req.query;
    let sql = `SELECT v.id, v.placa, v.modelo,
      SUM(vl.tempo_ocioso_total_segundos) as tempo_ocioso_total,
      SUM(vl.custo_combustivel_dia) as custo_combustivel
      FROM vehicle_logs vl JOIN veiculos v ON vl.veiculo_id = v.id WHERE 1=1`;
    const params = [];
    if (data_inicio) { sql += ` AND vl.data >= ?`; params.push(data_inicio); }
    if (data_fim) { sql += ` AND vl.data <= ?`; params.push(data_fim); }
    sql += ` GROUP BY v.id`;
    
    const data = db.prepare(sql).all(...params);
    // Custo estimado: 1h ocioso = ~0.7L de combustivel queimado
    const resultado = data.map(d => ({
      ...d,
      horas_ociosas: (d.tempo_ocioso_total / 3600).toFixed(2),
      custo_desperdicio: ((d.tempo_ocioso_total / 3600) * 0.7 * 5.89).toFixed(2),
    }));
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/sucesso-rota', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT endereco,
        COUNT(*) as total_tentativas,
        SUM(CASE WHEN tentativa_unica = 1 THEN 1 ELSE 0 END) as sucessos_1a,
        ROUND(CAST(SUM(CASE WHEN tentativa_unica = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 1) as taxa_sucesso
      FROM deliveries WHERE status = 'concluida'
      GROUP BY endereco HAVING total_tentativas >= 3
      ORDER BY taxa_sucesso ASC LIMIT 20
    `).all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/performance-temporal', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT strftime('%Y-%m', criada_em) as mes,
        COUNT(*) as total_entregas,
        ROUND(AVG(distancia_km), 1) as km_medio,
        ROUND(AVG(tempo_total_segundos) / 60.0, 1) as tempo_medio_min
      FROM deliveries WHERE status = 'concluida'
      GROUP BY mes ORDER BY mes DESC LIMIT 12
    `).all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/pagamentos', (req, res) => {
  try {
    const periodo = req.query.periodo || 'mes';

    // Acumulado por dia (ultimos 30 dias)
    const porDia = db.prepare(`
      SELECT DATE(criada_em) as dia, COUNT(*) as entregas, SUM(valor) as total, AVG(valor) as ticket_medio
      FROM deliveries WHERE status = 'concluida'
      GROUP BY dia ORDER BY dia DESC LIMIT 30
    `).all();

    // Acumulado por mes (ultimos 12 meses)
    const porMes = db.prepare(`
      SELECT strftime('%Y-%m', criada_em) as mes, COUNT(*) as entregas, SUM(valor) as total, AVG(valor) as ticket_medio
      FROM deliveries WHERE status = 'concluida'
      GROUP BY mes ORDER BY mes DESC LIMIT 12
    `).all();

    // Acumulado por ano
    const porAno = db.prepare(`
      SELECT strftime('%Y', criada_em) as ano, COUNT(*) as entregas, SUM(valor) as total, AVG(valor) as ticket_medio
      FROM deliveries WHERE status = 'concluida'
      GROUP BY ano ORDER BY ano DESC
    `).all();

    // Total geral
    const totalGeral = db.prepare(`
      SELECT COUNT(*) as total_entregas, SUM(valor) as total_pago, AVG(valor) as ticket_medio
      FROM deliveries WHERE status = 'concluida'
    `).get();

    // Por entregador
    const porEntregador = db.prepare(`
      SELECT e.nome, d.entregador_id, COUNT(*) as entregas, SUM(d.valor) as total_pago
      FROM deliveries d JOIN entregadores e ON d.entregador_id = e.id
      WHERE d.status = 'concluida'
      GROUP BY d.entregador_id ORDER BY total_pago DESC
    `).all();

    // Calcular totais do periodo selecionado
    let filtroData = '';
    const hoje = new Date();
    if (periodo === 'dia') filtroData = "AND criada_em >= datetime('now', '-1 day')";
    else if (periodo === 'semana') filtroData = "AND criada_em >= datetime('now', '-7 days')";
    else if (periodo === 'mes') filtroData = "AND criada_em >= datetime('now', '-30 days')";
    else if (periodo === 'ano') filtroData = "AND criada_em >= datetime('now', '-365 days')";

    const periodoData = db.prepare(`
      SELECT COUNT(*) as entregas, SUM(valor) as total_pago, AVG(valor) as ticket_medio
      FROM deliveries WHERE status = 'concluida' ${filtroData}
    `).get();

    // Media por dia no periodo
    const diasNoPeriodo = periodo === 'dia' ? 1 : periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : 365;
    const mediaPorDia = periodoData.total_pago ? (periodoData.total_pago / Math.min(diasNoPeriodo, 30)) : 0;

    res.json({
      periodo,
      periodoAtual: {
        entregas: periodoData.entregas,
        totalPago: periodoData.total_pago || 0,
        ticketMedio: periodoData.ticket_medio || 0,
        mediaPorDia: Math.round(mediaPorDia * 100) / 100,
      },
      totalGeral: {
        entregas: totalGeral.total_entregas,
        totalPago: totalGeral.total_pago || 0,
        ticketMedio: totalGeral.ticket_medio || 0,
      },
      porDia: porDia.map(d => ({ dia: d.dia, entregas: d.entregas, total: d.total || 0, ticketMedio: (d.ticket_medio || 0).toFixed(2) })),
      porMes: porMes.map(d => ({ mes: d.mes, entregas: d.entregas, total: d.total || 0, ticketMedio: (d.ticket_medio || 0).toFixed(2) })),
      porAno: porAno.map(d => ({ ano: d.ano, entregas: d.entregas, total: d.total || 0, ticketMedio: (d.ticket_medio || 0).toFixed(2) })),
      porEntregador: porEntregador.map(d => ({
        nome: d.nome || d.entregador_id,
        entregas: d.entregas,
        totalPago: d.total_pago || 0,
      })),
    });
  } catch (err) {
    console.error('Erro pagamentos:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/carbono', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT strftime('%Y-%m', data) as mes,
        SUM(km_rodado_dia) as km_total
      FROM vehicle_logs GROUP BY mes ORDER BY mes DESC LIMIT 12
    `).all();
    
    const FATOR_CO2 = 0.12; // kg CO2 por km (media leve)
    const ARVORES_POR_MES = 21; // kg CO2 que uma arvore absorve por mes
    
    const resultado = data.map(d => ({
      mes: d.mes,
      km_total: d.km_total,
      co2_kg: (d.km_total * FATOR_CO2).toFixed(2),
      co2_toneladas: (d.km_total * FATOR_CO2 / 1000).toFixed(4),
      arvores_equivalentes: (d.km_total * FATOR_CO2 / ARVORES_POR_MES).toFixed(1),
    }));
    
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== API: GEOFENCING ====================

app.post('/api/geofence/check', (req, res) => {
  const { entregador_id, delivery_id, lat, lng } = req.body;
  if (!entregador_id || !delivery_id || !lat || !lng) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(delivery_id);
    if (!delivery) return res.status(404).json({ error: 'Entrega nao encontrada' });

    if (!delivery.destino_lat || !delivery.destino_lng) {
      return res.json({ dentro: false, distancia: null });
    }

    // Calcular distancia em km (Haversine simplificado)
    const R = 6371;
    const dLat = (delivery.destino_lat - lat) * Math.PI / 180;
    const dLng = (delivery.destino_lng - lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(delivery.destino_lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanciaMetros = R * c * 1000;

    const dentro = distanciaMetros <= 50; // Raio de 50m

    if (dentro && !delivery.geofencing_entrada) {
      db.prepare("UPDATE deliveries SET geofencing_entrada = datetime('now') WHERE id = ?").run(delivery_id);
      
      // Criar alerta
      const ent = db.prepare('SELECT nome FROM entregadores WHERE id = ?').get(entregador_id);
      db.prepare(`INSERT INTO alerts (id, tipo, entregador_id, mensagem, gravidade) VALUES (?, 'geofence', ?, ?, 'baixo')`)
        .run(`GEOF_${Date.now()}`, entregador_id, `${ent.nome} entrou no raio de 50m do destino`);

      io.emit('geofence-alert', { entregador_id, delivery_id, mensagem: `${ent.nome} chegou ao destino` });
    }

    res.json({ dentro: distanciaMetros <= 50, distancia_metros: Math.round(distanciaMetros * 10) / 10 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== API: LINK DE RASTREAMENTO ====================

app.post('/api/tracking/generate', (req, res) => {
  const { delivery_id } = req.body;
  if (!delivery_id) return res.status(400).json({ error: 'delivery_id obrigatorio' });

  try {
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(delivery_id);
    if (!delivery) return res.status(404).json({ error: 'Entrega nao encontrada' });

    const token = crypto.randomBytes(16).toString('hex');
    db.prepare(`INSERT INTO tracking_sessions (id, delivery_id, token) VALUES (?, ?, ?)`)
      .run(`TRK_${Date.now()}`, delivery_id, token);

    const trackingUrl = `${req.protocol}://${req.get('host')}/track/${token}`;
    db.prepare('UPDATE deliveries SET link_rastreamento = ? WHERE id = ?').run(trackingUrl, delivery_id);

    res.json({ token, url: trackingUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pagina publica de rastreamento
app.get('/track/:token', (req, res) => {
  const session = db.prepare('SELECT ts.*, d.*, e.nome as entregador_nome FROM tracking_sessions ts JOIN deliveries d ON ts.delivery_id = d.id LEFT JOIN entregadores e ON d.entregador_id = e.id WHERE ts.token = ?').get(req.params.token);
  
  if (!session) {
    return res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rastreamento</title><style>body{font-family:Arial;text-align:center;padding:50px;background:#1a1a2e;color:#fff}h1{color:#e74c3c}</style></head><body><h1>❌ Link invalido</h1><p>Este link de rastreamento nao existe ou expirou.</p></body></html>`);
  }

  db.prepare("UPDATE tracking_sessions SET ultimo_acesso = datetime('now'), status = 'ativo' WHERE token = ?").run(req.params.token);

  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Rastreamento Overons</title>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Segoe UI,Arial,sans-serif;background:#1a1a2e;color:#fff;padding:20px}.card{background:#16213e;border-radius:12px;padding:20px;margin-bottom:15px;max-width:600px;margin:0 auto}.status-bar{background:#00b894;padding:8px;text-align:center;border-radius:8px;margin-bottom:15px}h2{color:#00b894;margin-bottom:10px}p{margin:5px 0;font-size:14px;color:#dfe6e9}.label{color:#636e72;font-size:12px}#map{height:300px;border-radius:12px;margin-top:15px}</style>
</head>
<body>
<div class="card">
  <div class="status-bar">📦 Sua entrega esta a caminho!</div>
  <h2>🚚 Rastreamento de Entrega</h2>
  <p><span class="label">Entregador:</span> ${session.entregador_nome || 'Atribuindo...'}</p>
  <p><span class="label">Destino:</span> ${session.endereco || '—'}</p>
  <p><span class="label">Cliente:</span> ${session.cliente_nome || '—'}</p>
  <p><span class="label">Status:</span> ${session.status === 'concluida' ? '✅ Entregue' : session.status === 'em_andamento' ? '🟡 A caminho' : '🟢 Pendente'}</p>
  <div id="map"></div>
</div>
<script>
  const map = L.map('map').setView([${session.destino_lat || -23.5505}, ${session.destino_lng || -46.6333}], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap'}).addTo(map);
  ${session.destino_lat ? `L.marker([${session.destino_lat}, ${session.destino_lng}]).addTo(map).bindPopup('📍 Destino: ${session.endereco}').openPopup();` : ''}
  L.circle([${session.destino_lat || -23.5505}, ${session.destino_lng || -46.6333}], {color:'#00b894',fillColor:'#00b894',fillOpacity:0.1,radius:50}).addTo(map);
</script>
</body></html>`);
});

// ==================== API: MOTORISTAS (SQLite) ====================

app.get('/api/entregadores', (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM entregadores ORDER BY nome').all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/veiculos', (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM veiculos ORDER BY placa').all();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== EXISTING API (JSON persistence) ====================

app.get('/api/drivers', (req, res) => {
  const lista = [];
  for (const [id, info] of drivers) {
    lista.push({ id, nome: info.nome || '', status: info.status, latitude: info.lastLat, longitude: info.lastLng, ultimaAtualizacao: info.lastSeen, entregasHoje: info.deliveriesCount });
  }
  res.json(lista);
});

app.get('/api/data', (req, res) => {
  res.json({ exportadoEm: new Date().toISOString(), totalMotoristas: drivers.size, totalEntregas: deliveries.length, motoristas: getDriversList(), entregas: deliveries.slice().reverse() });
});

app.get('/api/data/csv', (req, res) => {
  const BOM = '\uFEFF';
  const header = 'ID,ID Motorista,Endereco,Cliente,Valor,Status,Criada Em,Concluida Em';
  const rows = deliveries.map(d => { const c = (s) => `"${(s || '').replace(/"/g, '""')}"`; return [c(d.id), c(d.driverId), c(d.endereco), c(d.cliente), d.valor || 0, c(d.status), c(d.criadaEm), c(d.concluidaEm || '')].join(','); });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=overons_entregas.csv');
  res.send(BOM + header + '\n' + rows.join('\n'));
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on('driver-register', (data) => {
    if (!data || !data.driverId) return;
    if (!drivers.has(data.driverId)) {
      drivers.set(data.driverId, { id: data.driverId, nome: data.nome || '', status: data.status || 'online', lastLat: null, lastLng: null, lastSeen: new Date().toISOString(), deliveriesCount: 0, socketId: socket.id });
    } else {
      const d = drivers.get(data.driverId); d.status = data.status || d.status; d.socketId = socket.id; d.lastSeen = new Date().toISOString(); if (data.nome) d.nome = data.nome;
    }
    io.emit('drivers-update', getDriversList());
  });

  socket.on('driver-status', (data) => {
    if (!data || !data.driverId) return;
    const d = drivers.get(data.driverId);
    if (d) { d.status = data.status; d.lastSeen = new Date().toISOString(); io.emit('drivers-update', getDriversList()); }
  });

  socket.on('driver-location', (data) => {
    if (!data || !data.driverId || !data.latitude || !data.longitude) return;
    const isNew = !drivers.has(data.driverId);
    const existingNome = !isNew ? drivers.get(data.driverId).nome : '';
    drivers.set(data.driverId, { id: data.driverId, nome: existingNome || data.nome || '', status: 'online', lastLat: data.latitude, lastLng: data.longitude, lastSeen: new Date().toISOString(), deliveriesCount: isNew ? 0 : (drivers.get(data.driverId).deliveriesCount || 0), socketId: socket.id });
    io.emit('drivers-update', getDriversList());
    salvarDados();
    io.emit('location-update', { driverId: data.driverId, latitude: data.latitude, longitude: data.longitude, timestamp: data.timestamp || new Date().toISOString() });
  });

  socket.on('delivery-completed', (data) => {
    if (!data || !data.driverId) return;
    const entrega = { id: Date.now().toString(), driverId: data.driverId, nomeMotorista: data.nome || '', endereco: data.endereco || 'Nao informado', cliente: data.cliente || 'Nao informado', valor: data.valor || 0, status: 'concluida', criadaEm: data.timestamp || new Date().toISOString(), concluidaEm: new Date().toISOString() };
    deliveries.push(entrega);
    const d = drivers.get(data.driverId);
    if (d) { d.deliveriesCount = (d.deliveriesCount || 0) + 1; io.emit('drivers-update', getDriversList()); }
    io.emit('new-delivery-log', entrega); salvarDados();
  });

  socket.on('assign-delivery', (data) => {
    if (!data || !data.driverId || !data.endereco) return;
    const novaEntrega = { id: Date.now().toString(), driverId: data.driverId, endereco: data.endereco, cliente: data.cliente || 'Nao informado', valor: data.valor || 0, status: 'atribuida', criadaEm: new Date().toISOString(), concluidaEm: null };
    deliveries.push(novaEntrega);
    const d = drivers.get(data.driverId);
    if (d) io.to(d.socketId).emit('new-delivery', { id: novaEntrega.id, endereco: data.endereco, cliente: data.cliente, valor: data.valor });
    io.emit('new-delivery-log', novaEntrega); io.emit('drivers-update', getDriversList()); salvarDados();
  });

  // Empresa atribui entrega a um motorista (ou broadcast)
  socket.on('assign-delivery', (data) => {
    if (!data || !data.endereco) return;
    const entrega = {
      id: Date.now().toString(),
      entregadorId: data.driverId || '',
      endereco: data.endereco,
      cliente: data.cliente || 'Nao informado',
      valor: data.valor || 0,
      status: 'pendente',
      criadaEm: new Date().toISOString(),
      aceitaEm: null,
    };

    // Salva na memoria
    if (!globalEntregas) globalEntregas = [];
    globalEntregas.push(entrega);

    if (data.driverId) {
      // Enviar para motorista especifico
      const d = drivers.get(data.driverId);
      if (d && d.socketId) {
        io.to(d.socketId).emit('new-available-delivery', entrega);
        console.log(`📦 Entrega enviada para ${data.driverId} aguardar aceite`);
      }
    } else {
      // Broadcast para todos motoristas online
      let count = 0;
      for (const [id, d] of drivers) {
        if (d.status === 'online' && d.socketId) {
          io.to(d.socketId).emit('new-available-delivery', entrega);
          count++;
        }
      }
      console.log(`📦 Entrega enviada para ${count} motoristas aguardar aceite`);
    }

    io.emit('new-delivery-log', { ...entrega, status: 'pendente' });
    io.emit('drivers-update', getDriversList());
  });

  // Motorista aceita entrega
  socket.on('driver-accept-delivery', (data) => {
    if (!data || !data.entregaId) return;
    const entrega = globalEntregas?.find(e => e.id === data.entregaId);
    if (!entrega) return;

    entrega.status = 'aceita';
    entrega.aceitaEm = new Date().toISOString();
    entrega.entregadorId = data.driverId || '';

    console.log(`✅ Motorista ${data.driverId} aceitou entrega ${data.entregaId}`);
    io.emit('new-delivery-log', entrega);
    io.emit('drivers-update', getDriversList());
    io.emit('delivery-accepted', { entregaId: data.entregaId, driverId: data.driverId });
  });

  // Motorista recusa entrega
  socket.on('driver-reject-delivery', (data) => {
    if (!data || !data.entregaId) return;
    console.log(`❌ Motorista ${data.driverId || '?'} recusou entrega ${data.entregaId}`);
    // Reenvia para outros motoristas disponiveis
    const entrega = globalEntregas?.find(e => e.id === data.entregaId);
    if (entrega) {
      entrega.status = 'recusada';
      // Procura outro motorista online
      for (const [id, d] of drivers) {
        if (d.status === 'online' && d.socketId && id !== data.driverId) {
          io.to(d.socketId).emit('new-available-delivery', entrega);
          break;
        }
      }
    }
    io.emit('new-delivery-log', { ...entrega, status: 'recusada' });
  });

  // Empresa envia mensagem para o motorista
  socket.on('send-message', (data) => {
    if (!data || !data.driverId || !data.message) return;
    const d = drivers.get(data.driverId);
    const msgId = 'MSG_' + Date.now();
    const msgEntry = {
      id: msgId,
      driverId: data.driverId,
      nomeMotorista: d?.nome || '',
      empresa: data.empresa || 'Empresa',
      message: data.message,
      type: data.type || 'text',
      sentAt: new Date().toISOString(),
      readAt: null,
    };
    messageLog.push(msgEntry);

    if (d && d.socketId) {
      io.to(d.socketId).emit('new-message', { ...msgEntry });
      msgEntry.entregue = true;
    }
    io.emit('message-log-update', messageLog.slice(-50));
  });

  // Motorista confirma leitura
  socket.on('message-read', (data) => {
    if (!data || !data.messageId) return;
    const msg = messageLog.find(m => m.id === data.messageId);
    if (msg && !msg.readAt) {
      msg.readAt = new Date().toISOString();
      io.emit('message-log-update', messageLog.slice(-50));
    }
  });

  socket.on('disconnect', () => {
    for (const [id, d] of drivers) {
      if (d.socketId === socket.id) { d.status = 'offline'; d.lastSeen = new Date().toISOString(); io.emit('drivers-update', getDriversList()); break; }
    }
  });
});

function getDriversList() {
  const now = Date.now();
  const lista = [];
  for (const [id, info] of drivers) {
    // Pula motoristas offline sem atualizacao nos ultimos 5 minutos
    if (info.status === 'offline' && info.lastSeen) {
      const age = now - new Date(info.lastSeen).getTime();
      if (age > MAX_DRIVER_AGE_MS) {
        drivers.delete(id); // Remove automaticamente
        continue;
      }
    }
    lista.push({ id, nome: info.nome || '', status: info.status, latitude: info.lastLat, longitude: info.lastLng, ultimaAtualizacao: info.lastSeen, entregasHoje: info.deliveriesCount });
  }
  return lista;
}

// ==================== PERSISTENCIA ====================

const DATA_FILE = path.join(__dirname, '..', 'data.json');
const MAX_DRIVER_AGE_MS = 5 * 60 * 1000; // 5 minutos

function carregarDados() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const dados = JSON.parse(raw);
      if (dados.deliveries) deliveries.push(...dados.deliveries);
      console.log(`📂 Dados carregados: ${deliveries.length} entregas`);
    }
  } catch (err) { console.error('Erro ao carregar dados:', err.message); }
  // Nao carrega drivers do arquivo - sessoes sao apenas em tempo real
}

function salvarDados() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify({ ultimoSalvamento: new Date().toISOString(), drivers: Array.from(drivers.values()), deliveries }, null, 2), 'utf8'); }
  catch (err) { console.error('Erro ao salvar dados:', err.message); }
}

setInterval(salvarDados, 30000);
process.on('SIGINT', () => { salvarDados(); process.exit(); });
process.on('SIGTERM', () => { salvarDados(); process.exit(); });

// ==================== API: ADMIN (CENTRO DE CONTROLE) ====================

// Dashboard financeiro
app.get('/api/admin/dashboard', (req, res) => {
  try {
    const totalEmpresas = db.prepare('SELECT COUNT(*) as total FROM companies').get().total;
    const ativas = db.prepare("SELECT COUNT(*) as total FROM companies WHERE status = 'ativo'").get().total;
    const bloqueadas = db.prepare("SELECT COUNT(*) as total FROM companies WHERE status = 'bloqueado'").get().total;
    const trial = db.prepare("SELECT COUNT(*) as total FROM companies WHERE status = 'trial'").get().total;
    
    const faturamentoMes = db.prepare(`
      SELECT COALESCE(SUM(valor), 0) as total FROM payments 
      WHERE status = 'pago' AND strftime('%Y-%m', pago_em) = strftime('%Y-%m', 'now')
    `).get().total;
    
    const faturamentoAno = db.prepare(`
      SELECT COALESCE(SUM(valor), 0) as total FROM payments 
      WHERE status = 'pago' AND strftime('%Y', pago_em) = strftime('%Y', 'now')
    `).get().total;
    
    const inadimplentes = db.prepare(`
      SELECT COUNT(DISTINCT empresa_id) as total FROM payments 
      WHERE status = 'atrasado' AND data_vencimento < date('now')
    `).get().total;
    
    const receber = db.prepare(`
      SELECT COALESCE(SUM(valor), 0) as total FROM payments 
      WHERE status IN ('pendente','atrasado')
    `).get().total;

    // Faturamento ultimos 6 meses
    const faturamentoMensal = db.prepare(`
      SELECT strftime('%Y-%m', pago_em) as mes, COALESCE(SUM(valor), 0) as total
      FROM payments WHERE status = 'pago' AND pago_em IS NOT NULL
      GROUP BY mes ORDER BY mes DESC LIMIT 6
    `).all();

    res.json({
      empresas: { total: totalEmpresas, ativas, bloqueadas, trial, inadimplentes },
      financeiro: { faturamentoMes, faturamentoAno, aReceber: receber },
      faturamentoMensal,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Listar empresas
app.get('/api/admin/companies', (req, res) => {
  try {
    const empresas = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM payments WHERE empresa_id = c.id AND status = 'atrasado') as pagamentos_atrasados,
        (SELECT data_vencimento FROM payments WHERE empresa_id = c.id ORDER BY data_vencimento DESC LIMIT 1) as ultimo_vencimento,
        (SELECT COUNT(*) FROM entregadores WHERE empresa_id = c.id AND status = 'online') as motoristas_logados,
        (SELECT COUNT(*) FROM entregadores WHERE empresa_id = c.id) as motoristas_cadastrados
      FROM companies c ORDER BY c.criada_em DESC
    `).all();
    res.json(empresas);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cadastrar empresa
app.post('/api/admin/companies', (req, res) => {
  try {
    const { nome, cnpj, responsavel, email, telefone, plano } = req.body;
    if (!nome || !cnpj || !responsavel || !email) return res.status(400).json({ error: 'Campos obrigatorios: nome, cnpj, responsavel, email' });
    
    const id = 'EMP_' + Date.now().toString(36).toUpperCase();
    const precoPlano = { trial: 0, basico: 97, profissional: 297, enterprise: 997 };
    const preco = precoPlano[plano] || 0;
    const hoje = new Date().toISOString().split('T')[0];
    const venc = new Date(); venc.setMonth(venc.getMonth() + 1);
    const vencStr = venc.toISOString().split('T')[0];

    db.prepare('INSERT INTO companies (id, nome, cnpj, responsavel, email, telefone, plano, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, nome, cnpj, responsavel, email, telefone || null, plano || 'trial', 'ativo');
    db.prepare('INSERT INTO subscriptions (id, empresa_id, plano, valor, data_inicio, data_vencimento, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run('SUB_' + id, id, plano || 'trial', preco, hoje, vencStr, 'ativa');
    db.prepare('INSERT INTO payments (id, empresa_id, valor, data_pagamento, data_vencimento, metodo, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run('PAY_' + id + '_0', id, preco, preco > 0 ? hoje : null, vencStr, 'pix', preco > 0 ? 'pago' : 'pendente');

    res.json({ id, message: 'Empresa cadastrada com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bloquear empresa
app.put('/api/admin/companies/:id/block', (req, res) => {
  try {
    db.prepare("UPDATE companies SET status = 'bloqueado' WHERE id = ?").run(req.params.id);
    res.json({ message: 'Empresa bloqueada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Desbloquear empresa
app.put('/api/admin/companies/:id/unblock', (req, res) => {
  try {
    db.prepare("UPDATE companies SET status = 'ativo' WHERE id = ?").run(req.params.id);
    res.json({ message: 'Empresa desbloqueada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Listar pagamentos
app.get('/api/admin/payments', (req, res) => {
  try {
    const payments = db.prepare(`
      SELECT p.*, c.nome as empresa_nome, c.cnpj, c.status as empresa_status
      FROM payments p JOIN companies c ON p.empresa_id = c.id
      ORDER BY p.data_vencimento DESC LIMIT 50
    `).all();
    res.json(payments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Registrar pagamento
app.post('/api/admin/payments', (req, res) => {
  try {
    const { empresa_id, valor, metodo } = req.body;
    if (!empresa_id || !valor) return res.status(400).json({ error: 'empresa_id e valor obrigatorios' });
    
    const hoje = new Date().toISOString().split('T')[0];
    const venc = new Date(); venc.setMonth(venc.getMonth() + 1);
    const id = 'PAY_' + Date.now();

    db.prepare('INSERT INTO payments (id, empresa_id, valor, data_pagamento, data_vencimento, metodo, status, pago_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, empresa_id, valor, hoje, hoje, metodo || 'pix', 'pago', hoje);
    res.json({ id, message: 'Pagamento registrado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Atualizar plano/limites da empresa
app.put('/api/admin/companies/:id/plan', (req, res) => {
  try {
    const { plano, max_entregadores, max_veiculos } = req.body;
    if (!plano && !max_entregadores && !max_veiculos) {
      return res.status(400).json({ error: 'Informe plano, max_entregadores ou max_veiculos' });
    }
    const updates = [];
    const params = [];
    if (plano) { updates.push('plano = ?'); params.push(plano); }
    if (max_entregadores !== undefined) { updates.push('max_entregadores = ?'); params.push(max_entregadores); }
    if (max_veiculos !== undefined) { updates.push('max_veiculos = ?'); params.push(max_veiculos); }
    params.push(req.params.id);
    db.prepare(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ message: 'Plano atualizado com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Relatorio inadimplencia
app.get('/api/admin/reports/inadimplencia', (req, res) => {
  try {
    const inadimplentes = db.prepare(`
      SELECT c.id, c.nome, c.cnpj, c.responsavel, c.email, c.telefone, c.plano,
        COUNT(p.id) as total_atrasados,
        COALESCE(SUM(p.valor), 0) as total_devido,
        MIN(p.data_vencimento) as menor_vencimento,
        julianday('now') - julianday(MIN(p.data_vencimento)) as dias_atraso
      FROM companies c JOIN payments p ON c.id = p.empresa_id
      WHERE p.status = 'atrasado' AND c.status != 'bloqueado'
      GROUP BY c.id ORDER BY dias_atraso DESC
    `).all();

    res.json(inadimplentes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== ARMAZENAMENTO DE MENSAGENS ====================
const messageLog = [];

// API: historico de mensagens
app.get('/api/messages', (req, res) => {
  res.json(messageLog.slice(-100).reverse());
});

// ==================== API: ENTREGAS ====================
const entregasDB = [];

// Listar entregas cadastradas
app.get('/api/entregas', (req, res) => {
  res.json(entregasDB.slice().reverse());
});

// Listar entregas pendentes (disponiveis para motoristas)
app.get('/api/entregas/pendentes', (req, res) => {
  const pendentes = entregasDB.filter(e => e.status === 'pendente' || e.status === 'AGUARDANDO_CONFIRMACAO');
  res.json(pendentes.slice().reverse());
});

// Cadastrar nova entrega e disparar para motoristas
app.post('/api/entregas', (req, res) => {
  const { cliente, endereco, observacoes, produtos, tipoVeiculo, driverId } = req.body;
  if (!cliente || !endereco) return res.status(400).json({ erro: 'Cliente e endereco obrigatorios' });

  const pedidoId = 'PED-' + Date.now().toString(36).toUpperCase();
  const chaveAcesso = 'MAR-' + Date.now().toString(36).toUpperCase().slice(0, 8);

  const entrega = {
    id: Date.now().toString(),
    pedidoId,
    chaveAcesso,
    cliente,
    endereco,
    produtos: produtos || [],
    observacoes: observacoes || '',
    tipoVeiculo: tipoVeiculo || '',
    status: 'pendente',
    criadaEm: new Date().toISOString(),
    entregadorId: driverId || '',
  };

  entregasDB.push(entrega);

  // Disparar para motoristas via Socket.IO
  let enviadas = 0;
  if (driverId) {
    // Para motorista especifico
    const d = drivers.get(driverId);
    if (d && d.socketId) {
      io.to(d.socketId).emit('new-available-delivery', entrega);
      enviadas = 1;
    }
  } else {
    // Broadcast para todos motoristas online
    for (const [id, d] of drivers) {
      if (d.status === 'online' && d.socketId) {
        io.to(d.socketId).emit('new-available-delivery', entrega);
        enviadas++;
      }
    }
  }

  console.log(`📦 Entrega ${pedidoId} criada e enviada para ${enviadas} motorista(s)`);
  io.emit('new-delivery-log', entrega);
  io.emit('drivers-update', getDriversList());

  res.json({ success: true, pedidoId, chaveAcesso, enviadas });
});

// ==================== API: MENSAGENS VIA REST (FALLBACK) ====================

// Enviar mensagem via REST (mais confiavel que Socket.IO)
app.post('/api/send-message', (req, res) => {
  try {
    const { driverId, message, empresa } = req.body;
    if (!driverId || !message) return res.status(400).json({ error: 'driverId e message obrigatorios' });

    const d = drivers.get(driverId);
    const msgId = 'MSG_' + Date.now();
    const msgEntry = {
      id: msgId, driverId, nomeMotorista: d?.nome || '',
      empresa: empresa || 'Empresa', message, type: 'text',
      sentAt: new Date().toISOString(), readAt: null,
    };
    messageLog.push(msgEntry);
    let entregue = false;

    if (d && d.socketId) {
      io.to(d.socketId).emit('new-message', { ...msgEntry });
      entregue = true;
    }
    io.emit('message-log-update', messageLog.slice(-50));

    // Fallback: envia para TODOS os motoristas conectados (broadcast)
    if (!entregue) {
      let encontrados = 0;
      for (const [id, info] of drivers) {
        if (info.socketId && info.status === 'online') {
          io.to(info.socketId).emit('new-message', {
            type: 'text',
            message: `${message} (para: ${driverId})`,
            audioUrl: null,
            empresa: empresa || 'Empresa',
            timestamp: new Date().toISOString(),
          });
          encontrados++;
        }
      }
      console.log(`📢 Mensagem enviada em broadcast para ${encontrados} motoristas online`);
      entregue = encontrados > 0;
    }

    res.json({ entregue, motoristasOnline: Array.from(drivers.values()).filter(d => d.status === 'online').length });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    res.status(500).json({ error: err.message });
  }
});

// Diagnostico: ver motoristas conectados
app.get('/api/drivers-status', (req, res) => {
  const lista = [];
  for (const [id, info] of drivers) {
    lista.push({
      id,
      nome: info.nome,
      status: info.status,
      hasSocketId: !!info.socketId,
      lastSeen: info.lastSeen,
    });
  }
  const sockets = [...io.sockets.sockets.keys()];
  res.json({ totalMotoristas: lista.length, totalSockets: sockets.length, motoristas: lista });
});

// ==================== SERVE REACT BUILD ====================
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  // Serve assets do React
  app.use('/assets', express.static(path.join(frontendDist, 'assets')));
  app.get('/favicon.svg', (req, res) => res.sendFile(path.join(frontendDist, 'favicon.svg')));
  
  // Dashboard React
  app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  
  console.log(`📦 React build sendo servido de: ${frontendDist}`);
  console.log(`   🆕 Dashboard disponivel na rota /dashboard`);
} else {
  console.log(`⚠️  React build nao encontrado em ${frontendDist}`);
  console.log(`   Rode: cd frontend && npm run build`);
}

// ==================== INICIALIZACAO ====================

async function start() {
  db = await initDatabase();

  // Executar schema
  db.exec(SCHEMA_SQL);

  // Seed basico (empresas + dados demo)
  const countEmp = db.prepare('SELECT COUNT(*) as total FROM companies').get();
  if (countEmp.total === 0) {
    const planos = { trial: { entregadores: 3, veiculos: 2 }, basico: { entregadores: 5, veiculos: 3 }, profissional: { entregadores: 20, veiculos: 10 }, enterprise: { entregadores: 100, veiculos: 50 } };
    const empresas = [
      { id: 'EMP_001', nome: 'Overons Logistica', cnpj: '00.000.000/0001-01', responsavel: 'Administrador', email: 'admin@overons.com.br', telefone: '(11) 3000-0001', plano: 'enterprise', status: 'ativo' },
      { id: 'EMP_002', nome: 'TechExpress Entregas', cnpj: '11.111.111/0001-11', responsavel: 'Carlos Silva', email: 'carlos@techexpress.com', telefone: '(11) 3000-0002', plano: 'profissional', status: 'ativo' },
      { id: 'EMP_003', nome: 'RapidDelivery Ltda', cnpj: '22.222.222/0001-22', responsavel: 'Ana Oliveira', email: 'ana@rapiddelivery.com', telefone: '(11) 3000-0003', plano: 'basico', status: 'bloqueado' },
      { id: 'EMP_004', nome: 'FoodExpress Brasil', cnpj: '33.333.333/0001-33', responsavel: 'Pedro Santos', email: 'pedro@foodexpress.com', telefone: '(11) 3000-0004', plano: 'basico', status: 'ativo' },
      { id: 'EMP_005', nome: 'LogiMove Transportes', cnpj: '44.444.444/0001-44', responsavel: 'Maria Costa', email: 'maria@logimove.com', telefone: '(11) 3000-0005', plano: 'trial', status: 'trial' },
    ];
    for (const e of empresas) {
      const p = planos[e.plano];
      db.prepare('INSERT INTO companies (id, nome, cnpj, responsavel, email, telefone, plano, status, max_entregadores, max_veiculos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(e.id, e.nome, e.cnpj, e.responsavel, e.email, e.telefone, e.plano, e.status, p.entregadores, p.veiculos);
      const hoje = new Date().toISOString().split('T')[0];
      const venc = new Date(); venc.setMonth(venc.getMonth() + 1);
      db.prepare('INSERT INTO subscriptions (id, empresa_id, plano, valor, data_inicio, data_vencimento, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run('SUB_' + e.id, e.id, e.plano, 0, hoje, venc.toISOString().split('T')[0], 'ativa');
    }
    // Pagamentos mockados
    for (const e of empresas) {
      for (let m = 0; m < 4; m++) {
        const dataVenc = new Date(2026, 2 + m, 10);
        const isPago = e.status === 'ativo' ? Math.random() > 0.3 : Math.random() > 0.6;
        const dataPag = isPago ? new Date(dataVenc.getTime() + (Math.random() > 0.5 ? -2 : 3) * 86400000) : null;
        const status = !isPago ? (dataVenc < new Date() ? 'atrasado' : 'pendente') : 'pago';
        db.prepare('INSERT INTO payments (id, empresa_id, valor, data_pagamento, data_vencimento, metodo, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run('PAY_' + e.id + '_' + m, e.id, Math.floor(Math.random() * 50) + 90, dataPag ? dataPag.toISOString().split('T')[0] : null, dataVenc.toISOString().split('T')[0], ['pix', 'boleto', 'cartao'][m % 3], status);
      }
    }
    console.log('✅ Empresas e pagamentos seed criados');
  }

  const countEnt = db.prepare('SELECT COUNT(*) as total FROM entregadores').get();
  if (countEnt.total === 0) {
    console.log('⚠️ Sem dados demo de entregadores. Execute backend/seed.js manualmente se quiser dados de teste completos.');
    console.log('   O sistema funciona sem dados mockados.');
  }

  carregarDados();

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Overons API rodando na porta ${PORT}`);
    console.log(`📊 Dashboard Antigo: http://localhost:${PORT}/dashboard.html`);
    console.log(`🆕 Dashboard React: http://localhost:${PORT}/dashboard`);
    console.log(`✅ APIs disponiveis em /api/*`);
  });
}

start().catch(err => { console.error('FATAL:', err); process.exit(1); });
