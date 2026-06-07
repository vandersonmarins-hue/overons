const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', name: 'Marins WebSocket Server' }));
});

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Em memória: últimas posições
const positions = new Map();

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  const pedidoId = socket.handshake.query.pedidoId;
  const tipo = socket.handshake.query.tipo; // 'driver', 'client', 'central'

  // Motorista envia posição
  socket.on('position-update', (data) => {
    positions.set(pedidoId || socket.id, { ...data, socketId: socket.id, updatedAt: new Date().toISOString() });

    // Reencaminha para clientes acompanhando este pedido
    if (pedidoId) {
      io.to(`pedido:${pedidoId}`).emit('position-update', data);
      io.to('central').emit('position-update', { pedidoId, ...data });
    }
  });

  // Cliente entra em sala do pedido
  if (pedidoId && tipo === 'client') {
    socket.join(`pedido:${pedidoId}`);
    socket.emit('connected', { pedidoId, message: 'Acompanhando entrega em tempo real' });
  }

  // Central entra em sala global
  if (tipo === 'central') {
    socket.join('central');
    socket.emit('connected', { message: 'Central conectada - monitorando frotas' });
  }

  // Motorista envia mensagem para cliente
  socket.on('message-to-client', (data) => {
    io.to(`pedido:${data.pedidoId}`).emit('new-message', { from: 'driver', text: data.text, timestamp: new Date().toISOString() });
  });

  // Cliente envia mensagem para motorista
  socket.on('message-to-driver', (data) => {
    socket.to(`pedido:${data.pedidoId}`).emit('new-message', { from: 'client', text: data.text, timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
    positions.delete(pedidoId || socket.id);
  });
});

const PORT = process.env.WEBSOCKET_PORT || 3004;
server.listen(PORT, () => {
  console.log(`🔌 WebSocket Marins rodando na porta ${PORT}`);
  console.log(`   Conecte em: ws://localhost:${PORT}`);
});
