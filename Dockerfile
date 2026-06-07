# Overons - Delivery Tracking System
# Usa Node.js para servir backend + frontend estatico

FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependencia
COPY package*.json ./

# Instala apenas dependencias de producao
RUN npm install --omit=dev

# Copia todo o projeto
COPY . .

# Expoe a porta
EXPOSE 3000

# Comando de startup
CMD ["node", "backend/server.js"]
