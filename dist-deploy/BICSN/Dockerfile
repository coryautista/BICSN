# ---------- Build ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

COPY src ./src
COPY types ./types

RUN npm run build


# ---------- Runtime ----------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    FIREBIRD_CLIENT_LIB=/usr/lib/x86_64-linux-gnu/libfbclient.so.2

# Firebird client library (fbclient) for node-firebird-driver-native
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libfbclient2 \
  && rm -rf /var/lib/apt/lists/* \
  && (test -f /usr/lib/x86_64-linux-gnu/libfbclient.so.2 || test -f /lib/x86_64-linux-gnu/libfbclient.so.2) \
  && if [ ! -f /usr/lib/x86_64-linux-gnu/libfbclient.so.2 ] && [ -f /lib/x86_64-linux-gnu/libfbclient.so.2 ]; then ln -sf /lib/x86_64-linux-gnu/libfbclient.so.2 /usr/lib/x86_64-linux-gnu/libfbclient.so.2; fi \
  && (ln -sf /usr/lib/x86_64-linux-gnu/libfbclient.so.2 /usr/lib/x86_64-linux-gnu/libfbclient.so 2>/dev/null || true) \
  && (ln -sf /lib/x86_64-linux-gnu/libfbclient.so.2 /lib/x86_64-linux-gnu/libfbclient.so 2>/dev/null || true)

# Dependencias de producción
COPY package*.json ./
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 \
      make \
      g++ \
    && npm ci --omit=dev \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && npm cache clean --force

# Código compilado
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/types ./types

RUN mkdir -p logs archivosTmp temp \
  && useradd -m -u 1001 nodejs \
  && chown -R nodejs:nodejs /app \
  && chmod -R 775 logs archivosTmp temp

USER nodejs
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:8080/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node","dist/server.js"]

