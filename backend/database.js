const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'overons.db');
const db = new Database(DB_PATH);

// Ativar WAL mode e foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ==================== MIGRATIONS ====================

function migrate() {
  db.exec(`
    -- Tabela de entregadores (estendida)
    CREATE TABLE IF NOT EXISTS entregadores (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      telefone TEXT,
      veiculo_id TEXT,
      status TEXT DEFAULT 'offline',
      cadastro_em TEXT DEFAULT (datetime('now')),
      foto_url TEXT
    );

    -- Tabela de veiculos
    CREATE TABLE IF NOT EXISTS veiculos (
      id TEXT PRIMARY KEY,
      placa TEXT UNIQUE,
      modelo TEXT,
      ano INTEGER,
      capacidade_kg REAL DEFAULT 0,
      tipo_combustivel TEXT DEFAULT 'gasolina',
      consumo_medio_km_por_litro REAL DEFAULT 10.0,
      ativo INTEGER DEFAULT 1
    );

    -- Tabela de entregas (completa)
    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      empresa_id TEXT DEFAULT 'OVERONS_001',
      entregador_id TEXT,
      veiculo_id TEXT,
      cliente_nome TEXT NOT NULL,
      endereco TEXT NOT NULL,
      lat REAL,
      lng REAL,
      destino_lat REAL,
      destino_lng REAL,
      distancia_km REAL DEFAULT 0,
      tempo_total_segundos INTEGER DEFAULT 0,
      tempo_ocioso_segundos INTEGER DEFAULT 0,
      consumo_combustivel_litros REAL DEFAULT 0,
      tentativa_unica INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pendente' CHECK(status IN ('pendente','em_andamento','concluida','falha')),
      horario_previsto TEXT,
      horario_inicio TEXT,
      horario_fim TEXT,
      nota_cliente INTEGER DEFAULT 0 CHECK(nota_cliente BETWEEN 0 AND 5),
      comprovante_foto_url TEXT,
      link_rastreamento TEXT,
      risco_atraso TEXT DEFAULT 'baixo' CHECK(risco_atraso IN ('baixo','medio','alto')),
      geofencing_entrada TEXT,
      geofencing_saida TEXT,
      criada_em TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (entregador_id) REFERENCES entregadores(id),
      FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
    );

    -- Tabela de logs diarios do veiculo
    CREATE TABLE IF NOT EXISTS vehicle_logs (
      id TEXT PRIMARY KEY,
      veiculo_id TEXT NOT NULL,
      data TEXT NOT NULL,
      km_inicial REAL DEFAULT 0,
      km_final REAL DEFAULT 0,
      km_rodado_dia REAL DEFAULT 0,
      horimetro_inicial REAL DEFAULT 0,
      horimetro_final REAL DEFAULT 0,
      tempo_ocioso_total_segundos INTEGER DEFAULT 0,
      custo_combustivel_dia REAL DEFAULT 0,
      custo_manutencao_dia REAL DEFAULT 0,
      FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
    );

    -- Tabela de scorecards mensais
    CREATE TABLE IF NOT EXISTS driver_scorecards (
      id TEXT PRIMARY KEY,
      entregador_id TEXT NOT NULL,
      mes_ano TEXT NOT NULL,
      taxa_sucesso_primeira_tentativa REAL DEFAULT 0,
      pontualidade_media REAL DEFAULT 0,
      eficiencia_combustivel_km_por_litro REAL DEFAULT 0,
      avaliacao_media_cliente REAL DEFAULT 0,
      tempo_medio_parada_segundos INTEGER DEFAULT 0,
      total_entregas INTEGER DEFAULT 0,
      score_geral REAL DEFAULT 0,
      selo TEXT DEFAULT 'sem_selo' CHECK(selo IN ('sem_selo','bronze','prata','ouro')),
      FOREIGN KEY (entregador_id) REFERENCES entregadores(id)
    );

    -- Tabela de alertas
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL CHECK(tipo IN ('desvio_rota','alta_ociosidade','falha_tentativa','sla_estourando','geofence')),
      entregador_id TEXT,
      mensagem TEXT NOT NULL,
      gravidade TEXT DEFAULT 'medio' CHECK(gravidade IN ('baixo','medio','alto','critico')),
      lida INTEGER DEFAULT 0,
      criada_em TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (entregador_id) REFERENCES entregadores(id)
    );

    -- Tabela de sessoes de rastreamento (para tracking links)
    CREATE TABLE IF NOT EXISTS tracking_sessions (
      id TEXT PRIMARY KEY,
      delivery_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'ativo',
      ultimo_acesso TEXT,
      criada_em TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
    );
  `);

  console.log('✅ Migrations executadas com sucesso');
}

// ==================== SEED DATA ====================

function seed() {
  const count = db.prepare('SELECT COUNT(*) as total FROM entregadores').get();
  if (count.total > 0) {
    console.log(`📦 Banco ja possui dados (${count.total} entregadores) - pulando seed`);
    return;
  }

  console.log('🌱 Populando banco com dados mockados...');

  const veiculos = [
    { id: 'VH001', placa: 'ABC1A23', modelo: 'Fiat Fiorino 1.4', ano: 2022, capacidade_kg: 650, tipo_combustivel: 'gasolina', consumo_medio_km_por_litro: 10.5 },
    { id: 'VH002', placa: 'DEF4B56', modelo: 'VW Delivery Express', ano: 2023, capacidade_kg: 800, tipo_combustivel: 'diesel', consumo_medio_km_por_litro: 11.2 },
    { id: 'VH003', placa: 'GHI7C89', modelo: 'Fiat Strada', ano: 2021, capacidade_kg: 500, tipo_combustivel: 'gasolina', consumo_medio_km_por_litro: 12.0 },
    { id: 'VH004', placa: 'JKL0D12', modelo: 'Renault Kangoo', ano: 2023, capacidade_kg: 600, tipo_combustivel: 'gasolina', consumo_medio_km_por_litro: 11.8 },
    { id: 'VH005', placa: 'MNO3E45', modelo: 'Peugeot Partner', ano: 2022, capacidade_kg: 550, tipo_combustivel: 'gasolina', consumo_medio_km_por_litro: 10.9 },
  ];

  const entregadores = [
    { id: 'ENT_A1B2C3', nome: 'João Silva', telefone: '(11) 99999-0001', veiculo_id: 'VH001' },
    { id: 'ENT_D4E5F6', nome: 'Pedro Santos', telefone: '(11) 99999-0002', veiculo_id: 'VH002' },
    { id: 'ENT_G7H8I9', nome: 'Maria Oliveira', telefone: '(11) 99999-0003', veiculo_id: 'VH003' },
    { id: 'ENT_J0K1L2', nome: 'Carlos Pereira', telefone: '(11) 99999-0004', veiculo_id: 'VH004' },
    { id: 'ENT_M3N4O5', nome: 'Ana Costa', telefone: '(11) 99999-0005', veiculo_id: 'VH005' },
    { id: 'ENT_P6Q7R8', nome: 'Lucas Almeida', telefone: '(11) 99999-0006' },
    { id: 'ENT_S9T0U1', nome: 'Fernanda Lima', telefone: '(11) 99999-0007' },
    { id: 'ENT_V2W3X4', nome: 'Roberto Gomes', telefone: '(11) 99999-0008' },
    { id: 'ENT_Y5Z6A7', nome: 'Juliana Rocha', telefone: '(11) 99999-0009' },
    { id: 'ENT_B8C9D0', nome: 'Marcos Dias', telefone: '(11) 99999-0010' },
  ];

  // Inserir veiculos
  const insVeiculo = db.prepare('INSERT OR IGNORE INTO veiculos (id, placa, modelo, ano, capacidade_kg, tipo_combustivel, consumo_medio_km_por_litro) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const v of veiculos) {
    insVeiculo.run(v.id, v.placa, v.modelo, v.ano, v.capacidade_kg, v.tipo_combustivel, v.consumo_medio_km_por_litro);
  }

  // Inserir entregadores
  const insEnt = db.prepare('INSERT OR IGNORE INTO entregadores (id, nome, telefone, veiculo_id, status) VALUES (?, ?, ?, ?, ?)');
  for (const e of entregadores) {
    insEnt.run(e.id, e.nome, e.telefone, e.veiculo_id || null, 'offline');
  }

  // Gerar entregas nos ultimos 30 dias
  const bairrosSP = [
    'Av. Paulista, 1000', 'Rua Augusta, 500', 'Rua Oscar Freire, 200',
    'Av. Faria Lima, 1500', 'Rua Teodoro Sampaio, 800', 'Rua Haddock Lobo, 300',
    'Av. Rebouças, 1200', 'Rua da Consolação, 700', 'Rua Bela Cintra, 400',
    'Av. Brigadeiro Faria Lima, 2000',
  ];
  const clientes = [
    'Lojas Tech', 'Padaria Pão Quente', 'Mercado Bom Preço',
    'Farmácia Saúde', 'Restaurante Sabor do Chef', 'Papelaria Escola',
    'Academia Fit', 'Pet Shop Amigo', 'Distribuidora Bebidas', 'Loja de Presentes',
  ];

  const insDelivery = db.prepare(`INSERT INTO deliveries 
    (id, entregador_id, veiculo_id, cliente_nome, endereco, lat, lng, destino_lat, destino_lng, 
     distancia_km, tempo_total_segundos, tempo_ocioso_segundos, consumo_combustivel_litros,
     tentativa_unica, status, horario_previsto, horario_inicio, horario_fim, nota_cliente, criada_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  for (let d = 0; d < 30; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];

    // 15-25 entregas por dia
    const numEntregas = 15 + Math.floor(Math.random() * 11);
    
    for (let i = 0; i < numEntregas; i++) {
      const ent = entregadores[Math.floor(Math.random() * entregadores.length)];
      const bairro = bairrosSP[Math.floor(Math.random() * bairrosSP.length)];
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];

      const horaPrevista = 8 + Math.floor(Math.random() * 10); // 8h às 18h
      const minPrevisto = Math.floor(Math.random() * 60);
      const horarioPrevisto = `${dateStr}T${String(horaPrevista).padStart(2, '0')}:${String(minPrevisto).padStart(2, '0')}:00`;

      const atrasoMin = Math.floor(Math.random() * 30) - 5; // -5 a 25 min de atraso
      const horaInicio = horaPrevista + Math.floor(Math.random() * 2);
      const minInicio = Math.floor(Math.random() * 60);
      const horarioInicio = `${dateStr}T${String(horaInicio).padStart(2, '0')}:${String(minInicio).padStart(2, '0')}:00`;

      const duracaoMin = 15 + Math.floor(Math.random() * 90); // 15-105 min
      const horaFim = horaInicio + Math.floor((minInicio + duracaoMin + atrasoMin) / 60);
      const minFim = (minInicio + duracaoMin + atrasoMin) % 60;
      const horarioFim = `${dateStr}T${String(horaFim).padStart(2, '0')}:${String(minFim).padStart(2, '0')}:00`;

      const distancia = 2 + Math.random() * 18; // 2-20 km
      const tempoOcioso = Math.floor(Math.random() * 600); // 0-10 min ocioso
      const consumo = (distancia / (8 + Math.random() * 5));
      const tentativaUnica = Math.random() > 0.15 ? 1 : 0; // 85% sucesso 1a tentativa
      const status = Math.random() > 0.05 ? 'concluida' : (Math.random() > 0.5 ? 'falha' : 'concluida');
      const nota = status === 'concluida' ? Math.floor(Math.random() * 3) + 3 : 0; // 3-5

      // SP coordinates with slight variations
      const latBase = -23.5505 + (Math.random() - 0.5) * 0.08;
      const lngBase = -46.6333 + (Math.random() - 0.5) * 0.08;
      const destLat = latBase + (Math.random() - 0.5) * 0.02;
      const destLng = lngBase + (Math.random() - 0.5) * 0.02;

      insDelivery.run(
        `DEL_${dateStr}_${String(i).padStart(3, '0')}`, ent.id, ent.veiculo_id || null,
        cliente, bairro, latBase, lngBase, destLat, destLng,
        Math.round(distancia * 10) / 10,
        Math.round(duracaoMin * 60),
        tempoOcioso, Math.round(consumo * 100) / 100,
        tentativaUnica, status, horarioPrevisto, horarioInicio,
        status === 'concluida' ? horarioFim : null,
        nota, `${dateStr}T${String(horaPrevista).padStart(2, '0')}:00:00`
      );
    }
  }

  // Gerar vehicle_logs para os ultimos 30 dias
  const insLog = db.prepare(`INSERT INTO vehicle_logs 
    (id, veiculo_id, data, km_inicial, km_final, km_rodado_dia, tempo_ocioso_total_segundos, custo_combustivel_dia, custo_manutencao_dia)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const v of veiculos) {
    let kmAtual = 50000 + Math.floor(Math.random() * 10000);
    for (let d = 0; d < 30; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];
      const kmDia = 30 + Math.floor(Math.random() * 100);
      const kmFinal = kmAtual + kmDia;
      const tempoOcioso = 300 + Math.floor(Math.random() * 1800); // 5-35 min
      const custoComb = (kmDia / (v.consumo_medio_km_por_litro + (Math.random() - 0.5) * 2)) * 5.89;
      const custoManut = Math.random() * 30;

      insLog.run(
        `${v.id}_${dateStr}`, v.id, dateStr,
        kmAtual, kmFinal, kmDia, tempoOcioso,
        Math.round(custoComb * 100) / 100,
        Math.round(custoManut * 100) / 100
      );
      kmAtual = kmFinal;
    }
  }

  // Gerar scorecards mensais
  const insScore = db.prepare(`INSERT INTO driver_scorecards 
    (id, entregador_id, mes_ano, taxa_sucesso_primeira_tentativa, pontualidade_media, 
     eficiencia_combustivel_km_por_litro, avaliacao_media_cliente, tempo_medio_parada_segundos, total_entregas, score_geral, selo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const meses = ['2026-04', '2026-05', '2026-06'];
  for (const ent of entregadores) {
    for (const mes of meses) {
      const txSucesso = 70 + Math.floor(Math.random() * 25);
      const pontualidade = 65 + Math.floor(Math.random() * 30);
      const eficiencia = 8 + Math.random() * 5;
      const avaliacao = 3 + Math.random() * 2;
      const tempoParada = 120 + Math.floor(Math.random() * 240);
      const totalEnt = 80 + Math.floor(Math.random() * 120);
      const score = (txSucesso * 0.3 + pontualidade * 0.3 + (eficiencia / 15 * 100) * 0.2 + avaliacao / 5 * 100 * 0.2);
      
      let selo = 'sem_selo';
      if (score >= 85) selo = 'ouro';
      else if (score >= 70) selo = 'prata';
      else if (score >= 55) selo = 'bronze';

      insScore.run(
        `${ent.id}_${mes}`, ent.id, mes,
        Math.round(txSucesso * 10) / 10,
        Math.round(pontualidade * 10) / 10,
        Math.round(eficiencia * 100) / 100,
        Math.round(avaliacao * 10) / 10,
        tempoParada, totalEnt,
        Math.round(score * 10) / 10,
        selo
      );
    }
  }

  // Gerar alertas mockados
  const insAlert = db.prepare(`INSERT INTO alerts (id, tipo, entregador_id, mensagem, gravidade, criada_em) VALUES (?, ?, ?, ?, ?, ?)`);
  
  const tiposAlert = ['desvio_rota', 'alta_ociosidade', 'falha_tentativa', 'sla_estourando', 'geofence'];
  const gravidades = ['baixo', 'medio', 'alto', 'critico'];
  
  for (let i = 0; i < 20; i++) {
    const alertDate = new Date();
    alertDate.setMinutes(alertDate.getMinutes() - Math.floor(Math.random() * 120));
    const ent = entregadores[Math.floor(Math.random() * entregadores.length)];
    const tipo = tiposAlert[Math.floor(Math.random() * tiposAlert.length)];
    const grav = gravidades[Math.floor(Math.random() * gravidades.length)];
    
    let msg = '';
    switch (tipo) {
      case 'desvio_rota': msg = `${ent.nome} desviou da rota ha 5min`; break;
      case 'alta_ociosidade': msg = `Veiculo com alta ociosidade (15min parado ligado)`; break;
      case 'falha_tentativa': msg = `Entrega #DEL_${Math.floor(Math.random() * 1000)} falhou na 1a tentativa`; break;
      case 'sla_estourando': msg = `${ent.nome} previsto para estourar SLA em 10min`; break;
      case 'geofence': msg = `${ent.nome} entrou no raio de entrega`; break;
    }
    
    insAlert.run(
      `ALERT_${i}`, tipo, ent.id, msg, grav, alertDate.toISOString()
    );
  }

  console.log('✅ Dados mockados inseridos com sucesso!');
  console.log(`   - ${entregadores.length} entregadores`);
  console.log(`   - ${veiculos.length} veiculos`);
  console.log(`   - ~${30 * 20} entregas (30 dias)`);
  console.log(`   - ${veiculos.length * 30} logs de veiculo`);
  console.log(`   - ${entregadores.length * 3} scorecards mensais`);
}

// ==================== EXPORT ====================

module.exports = { db, migrate, seed };

// Executar se chamado diretamente
if (require.main === module) {
  migrate();
  seed();
  console.log('✅ Database pronto!');
  process.exit(0);
}
