# syntax=docker/dockerfile:1
# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./

# Instalar dependencias limpias
RUN npm ci || npm install

# Copiar el grueso de la app y compilar TS/Vite
COPY . .
RUN npm run build

# 2. Production Stage (Nginx)
FROM nginx:alpine

# Copiar el build compilado del FrontEnd a la ruta default de nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto por el que correrá Vite/Nginx
EXPOSE 80

# Script run-in-foreground por default en nginx
CMD ["nginx", "-g", "daemon off;"]
