const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const path = require('path');

// Middleware para JSON
app.use(express.json());

// Serve arquivos estaticos (HTML, CSS, JS) da raiz do projeto
app.use(express.static(path.join(__dirname, '..')));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ==================== ARMAZENAMENTO EM MEMORIA ====================
const drivers = new Map();   // driverId -> { id, status, lastLat, lastLng, lastSeen, deliveriesCount, socketId }
const deliveries = [];       // Array de entregas: { id, driverId, endereco, cliente, status, criadaEm, concluidaEm }

// ==================== ROTAS REST API ====================

app.get('/', (req, res) => {
  res.send('Servidor de rastreamento de entregadores ativo!');
});

// Listar motoristas ativos
app.get('/api/drivers', (req, res) => {
  const lista = [];
  for (const [id, info] of drivers) {
    lista.push({
      id,
      status: info.status,
      latitude: info.lastLat,
      longitude: info.lastLng,
      ultimaAtualizacao: info.lastSeen,
      entregasHoje: info.deliveriesCount,
    });
  }
  res.json(lista);
});

// Listar histórico de entregas
app.get('/api/deliveries', (req, res) => {
  res.json(deliveries.slice(-50).reverse()); // ultimas 50
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  // Registrar motorista
  socket.on('driver-register', (data) => {
    if (!data || !data.driverId) return;
    console.log(`Motorista registrado: ${data.driverId}`);

    if (!drivers.has(data.driverId)) {
      drivers.set(data.driverId, {
        id: data.driverId,
        status: data.status || 'online',
        lastLat: null,
        lastLng: null,
        lastSeen: new Date().toISOString(),
        deliveriesCount: 0,
        socketId: socket.id,
      });
    } else {
      const d = drivers.get(data.driverId);
      d.status = data.status || d.status;
      d.socketId = socket.id;
      d.lastSeen = new Date().toISOString();
    }

    io.emit('drivers-update', getDriversList());
  });

  // Atualizar status (online/offline)
  socket.on('driver-status', (data) => {
    if (!data || !data.driverId) return;
    const d = drivers.get(data.driverId);
    if (d) {
      d.status = data.status;
      d.lastSeen = new Date().toISOString();
      io.emit('drivers-update', getDriversList());
    }
  });

  // Receber localizacao do motorista
  socket.on('driver-location', (data) => {
    if (!data || !data.driverId || !data.latitude || !data.longitude) {
      console.warn('Dados inválidos:', data);
      return;
    }

    // Atualizar dados do motorista
    if (drivers.has(data.driverId)) {
      const d = drivers.get(data.driverId);
      d.lastLat = data.latitude;
      d.lastLng = data.longitude;
      d.lastSeen = new Date().toISOString();
    } else {
      drivers.set(data.driverId, {
        id: data.driverId,
        status: 'online',
        lastLat: data.latitude,
        lastLng: data.longitude,
        lastSeen: new Date().toISOString(),
        deliveriesCount: 0,
        socketId: socket.id,
      });
      io.emit('drivers-update', getDriversList());
    }

    const locationData = {
      driverId: data.driverId,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: data.timestamp || new Date().toISOString(),
    };

    io.emit('location-update', locationData);
  });

  // Entrega concluida
  socket.on('delivery-completed', (data) => {
    if (!data || !data.driverId) return;

    const entrega = {
      id: Date.now().toString(),
      driverId: data.driverId,
      endereco: data.endereco || 'Nao informado',
      cliente: data.cliente || 'Nao informado',
      valor: data.valor || 0,
      status: 'concluida',
      criadaEm: data.timestamp || new Date().toISOString(),
      concluidaEm: new Date().toISOString(),
    };

    deliveries.push(entrega);

    // Atualizar contagem do motorista
    const d = drivers.get(data.driverId);
    if (d) {
      d.deliveriesCount = (d.deliveriesCount || 0) + 1;
      io.emit('drivers-update', getDriversList());
    }

    io.emit('new-delivery-log', entrega);
    console.log(`Entrega concluida: ${data.driverId} - R$ ${data.valor}`);
  });

  // Gestor atribui nova entrega a um motorista
  socket.on('assign-delivery', (data) => {
    if (!data || !data.driverId || !data.endereco) return;

    const novaEntrega = {
      id: Date.now().toString(),
      driverId: data.driverId,
      endereco: data.endereco,
      cliente: data.cliente || 'Nao informado',
      valor: data.valor || 0,
      status: 'atribuida',
      criadaEm: new Date().toISOString(),
      concluidaEm: null,
    };

    deliveries.push(novaEntrega);

    // Enviar para o motorista especifico
    const d = drivers.get(data.driverId);
    if (d) {
      io.to(d.socketId).emit('new-delivery', {
        id: novaEntrega.id,
        endereco: data.endereco,
        cliente: data.cliente,
        valor: data.valor,
      });
    }

    io.emit('new-delivery-log', novaEntrega);
    io.emit('drivers-update', getDriversList());
    console.log(`Entrega atribuida a ${data.driverId}: ${data.endereco}`);
  });

  // Desconexao
  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);

    // Marcar motorista como offline
    for (const [id, d] of drivers) {
      if (d.socketId === socket.id) {
        d.status = 'offline';
        d.lastSeen = new Date().toISOString();
        io.emit('drivers-update', getDriversList());
        break;
      }
    }
  });
});

// ==================== HELPERS ====================

function getDriversList() {
  const lista = [];
  for (const [id, info] of drivers) {
    lista.push({
      id,
      status: info.status,
      latitude: info.lastLat,
      longitude: info.lastLng,
      ultimaAtualizacao: info.lastSeen,
      entregasHoje: info.deliveriesCount,
    });
  }
  return lista;
}

// ==================== INICIALIZACAO ====================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
