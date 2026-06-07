# Overons - Delivery Tracking System
# Usa Node.js para servir backend + frontend estatico

FROM node:20-alpine AS builder

WORKDIR /app

# Copia tudo necessario para build do frontend
COPY frontend/package*.json ./frontend/
RUN npm --prefix frontend install

COPY frontend/ ./frontend/
RUN npm --prefix frontend run build

# Imagem final (menor)
FROM node:20-alpine

WORKDIR /app

# Copia dependencias do backend
COPY package*.json ./
RUN npm install --omit=dev

# Copia codigo do backend e build do frontend
COPY backend/ ./backend/
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copia HTMLs da raiz (driver, dashboard antigo)
COPY *.html ./

# Expoe a porta
EXPOSE 3000

# Comando de startup
CMD ["node", "backend/server.js"]
