# syntax=docker/dockerfile:1.7
# Image de prod Next.js (standalone) + Prisma 7, optimisée pour Dokploy.
# Cibles :
#   runner  (défaut) -> l'app, ~ 60 Mo de couches applicatives sur node:alpine
#   migrate          -> `prisma migrate deploy`, lancé une fois avant l'app

ARG NODE_VERSION=24-alpine

# ---- deps : node_modules complets (build + CLI Prisma) ----
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ---- builder : prisma generate + next build ----
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- migrate : applique les migrations puis s'arrête (image séparée, seulement la CLI Prisma) ----
FROM node:${NODE_VERSION} AS migrate
WORKDIR /app
COPY package.json /tmp/package.json
RUN --mount=type=cache,target=/root/.npm \
    PRISMA=$(node -p "require('/tmp/package.json').dependencies.prisma") && \
    DOTENV=$(node -p "require('/tmp/package.json').dependencies.dotenv") && \
    npm init -y >/dev/null && \
    npm install --no-audit --no-fund "prisma@$PRISMA" "dotenv@$DOTENV" && \
    rm /tmp/package.json
COPY prisma.config.ts ./
COPY prisma ./prisma
ENV NODE_ENV=production
USER node
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]

# ---- runner : image finale minimale ----
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
