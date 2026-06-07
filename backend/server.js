const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const path = require('path');

// Serve arquivos estaticos (HTML, CSS, JS) da raiz do projeto
app.use(express.static(path.join(__dirname, '..')));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/', (req, res) => {
  res.send('Servidor de rastreamento de entregadores ativo!');
});

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on('driver-location', (data) => {
    if (!data || !data.driverId || !data.latitude || !data.longitude) {
      console.warn('Dados inválidos:', data);
      return;
    }

    const locationData = {
      driverId: data.driverId,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: data.timestamp || new Date().toISOString(),
    };

    console.log(`Entregador ${locationData.driverId}:`, locationData.latitude, locationData.longitude);
    io.emit('location-update', locationData);
  });

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});