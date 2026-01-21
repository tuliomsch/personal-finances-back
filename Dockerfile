# --- BASE (Compartida) ---
FROM node:20-alpine AS base
WORKDIR /app
# Copiamos solo los archivos de definición primero
COPY package*.json ./
# Copiamos la carpeta prisma porque se necesita para instalar dependencias si tienes scripts post-install
COPY prisma ./prisma/

# --- DEVELOPMENT STAGE ---
# Usamos este target para desarrollar en local (Docker Compose)
FROM base AS dev
# Instalamos TODAS las dependencias
RUN npm install
# Generamos el cliente de Prisma para Linux (Importante)
RUN npx prisma generate
# Copiamos el resto del código
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# --- BUILDER STAGE (Solo para construir prod) ---
FROM base AS builder
WORKDIR /app
RUN npm ci
COPY . .
# Generamos cliente prisma antes del build
RUN npx prisma generate
RUN npm run build

# --- PRODUCTION STAGE ---
# Esta es la imagen final que irá a Render
FROM node:20-alpine AS production
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Solo dependencias de producción
RUN npm ci --only=production

# ¡IMPORTANTE! Regeneramos Prisma Client para el entorno de producción (Alpine Linux)
RUN npx prisma generate

# Copiamos desde el builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# CORRECCIÓN AQUÍ: Apuntamos a la ruta correcta que vimos en tu log
CMD ["node", "dist/src/main"]