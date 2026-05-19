#!/bin/sh
set -eu

RAR_NAME='BICSN-deploy-20260519-0326.rar'
BASE_DIR='/home/administrador/back'
CIPHER_DIR='/home/administrador/back/.cifrado'
PRIVATE_DIR='/home/administrador/back/privado'
ENCFS_PASS='cory'
SSH_PASS='Desarroll0.'

EXTRACT_DIR="$PRIVATE_DIR/_deploy_extract"
DEV_DIR="$PRIVATE_DIR/desarrollo"
PROD_DIR="$PRIVATE_DIR/produccion"
ENV_SOURCE="$BASE_DIR/.env.deploy"
RAR_SOURCE="$BASE_DIR/$RAR_NAME"
RAR_PRIVATE="$PRIVATE_DIR/$RAR_NAME"

cleanup() {
  cd "$BASE_DIR" 2>/dev/null || cd /tmp
  if mountpoint -q "$PRIVATE_DIR"; then
    fusermount -u "$PRIVATE_DIR" || sudo fusermount -u "$PRIVATE_DIR" || true
  fi
}
trap cleanup EXIT

if mountpoint -q "$PRIVATE_DIR" && ! ls "$PRIVATE_DIR" >/dev/null 2>&1; then
  echo "$SSH_PASS" | sudo -S fusermount -u "$PRIVATE_DIR" || true
fi

mkdir -p "$CIPHER_DIR" "$PRIVATE_DIR"
echo "$SSH_PASS" | sudo -S chown -R administrador:administrador "$CIPHER_DIR" "$PRIVATE_DIR"
echo "$SSH_PASS" | sudo -S sh -c "grep -q '^user_allow_other' /etc/fuse.conf || sed -i 's/^#user_allow_other/user_allow_other/' /etc/fuse.conf || echo user_allow_other >> /etc/fuse.conf"

if ! mountpoint -q "$PRIVATE_DIR"; then
  echo "$SSH_PASS" | sudo -S sh -c "printf '%s\n' '$ENCFS_PASS' | encfs --stdinpass --public '$CIPHER_DIR' '$PRIVATE_DIR'"
fi

if test -f "$RAR_SOURCE"; then
  mv -f "$RAR_SOURCE" "$RAR_PRIVATE"
elif test ! -f "$RAR_PRIVATE"; then
  echo "No se encontro el RAR en $RAR_SOURCE ni en $RAR_PRIVATE."
  exit 1
fi

if ! command -v unrar >/dev/null 2>&1 && ! command -v 7z >/dev/null 2>&1; then
  echo "$SSH_PASS" | sudo -S apt-get update
  (echo "$SSH_PASS" | sudo -S apt-get install -y unrar p7zip-full) || (echo "$SSH_PASS" | sudo -S apt-get install -y unrar-free p7zip-full)
fi

rm -rf "$EXTRACT_DIR"
mkdir -p "$EXTRACT_DIR"
cd "$EXTRACT_DIR"
if command -v unrar >/dev/null 2>&1; then
  unrar x -o+ "$RAR_PRIVATE"
else
  7z x -y "$RAR_PRIVATE"
fi

mkdir -p "$DEV_DIR" "$PROD_DIR"
if test -f "$DEV_DIR/.env"; then cp "$DEV_DIR/.env" "$DEV_DIR/.env.deploy.bak"; fi
if test -f "$PROD_DIR/.env"; then cp "$PROD_DIR/.env" "$PROD_DIR/.env.deploy.bak"; fi

rm -rf "$DEV_DIR/src" "$DEV_DIR/types" "$DEV_DIR/Dockerfile" "$DEV_DIR/docker-compose.yml" "$DEV_DIR/package.json" "$DEV_DIR/package-lock.json" "$DEV_DIR/tsconfig.json" "$DEV_DIR/.dockerignore" "$DEV_DIR/README-DEPLOY.txt"
rm -rf "$PROD_DIR/src" "$PROD_DIR/types" "$PROD_DIR/Dockerfile" "$PROD_DIR/docker-compose.yml" "$PROD_DIR/package.json" "$PROD_DIR/package-lock.json" "$PROD_DIR/tsconfig.json" "$PROD_DIR/.dockerignore" "$PROD_DIR/README-DEPLOY.txt"

cp -a "$EXTRACT_DIR"/. "$DEV_DIR"/
cp -a "$EXTRACT_DIR"/. "$PROD_DIR"/

if test -f "$DEV_DIR/.env.deploy.bak"; then cp "$DEV_DIR/.env.deploy.bak" "$DEV_DIR/.env"; elif test -f "$ENV_SOURCE"; then cp "$ENV_SOURCE" "$DEV_DIR/.env"; fi
if test -f "$PROD_DIR/.env.deploy.bak"; then cp "$PROD_DIR/.env.deploy.bak" "$PROD_DIR/.env"; elif test -f "$ENV_SOURCE"; then cp "$ENV_SOURCE" "$PROD_DIR/.env"; fi

if test ! -f "$DEV_DIR/.env" || test ! -f "$PROD_DIR/.env"; then
  echo "No se encontro .env base para generar desarrollo y produccion."
  exit 1
fi

sed -i 's/^PORT=.*/PORT=8080/' "$DEV_DIR/.env"
sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' "$DEV_DIR/.env"
sed -i 's/^SQLSERVER_DB=.*/SQLSERVER_DB=SII-ISSSSPEA/' "$DEV_DIR/.env"

sed -i 's/^PORT=.*/PORT=8080/' "$PROD_DIR/.env"
sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' "$PROD_DIR/.env"
sed -i 's/^SQLSERVER_DB=.*/SQLSERVER_DB=SII-ISSSSPEA-PROD/' "$PROD_DIR/.env"

cat > "$DEV_DIR/docker-compose.yml" <<'COMPOSE_DEV'
services:
  bicsn-api:
    container_name: bicsn-des-api
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: production
      HOST: 0.0.0.0
      PORT: 8080
      FIREBIRD_CLIENT_LIB: /usr/lib/x86_64-linux-gnu/libfbclient.so.2
    env_file:
      - .env
    volumes:
      - bicsn_des_logs:/app/logs
      - bicsn_des_archivosTmp:/app/archivosTmp
      - bicsn_des_temp:/app/temp
    restart: unless-stopped
    networks:
      - bicsn-des-network

networks:
  bicsn-des-network:
    driver: bridge

volumes:
  bicsn_des_logs:
  bicsn_des_archivosTmp:
  bicsn_des_temp:
COMPOSE_DEV

cat > "$PROD_DIR/docker-compose.yml" <<'COMPOSE_PROD'
services:
  bicsn-api:
    container_name: bicsn-prod-api
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "9090:8080"
    environment:
      NODE_ENV: production
      HOST: 0.0.0.0
      PORT: 8080
      FIREBIRD_CLIENT_LIB: /usr/lib/x86_64-linux-gnu/libfbclient.so.2
    env_file:
      - .env
    volumes:
      - bicsn_prod_logs:/app/logs
      - bicsn_prod_archivosTmp:/app/archivosTmp
      - bicsn_prod_temp:/app/temp
    restart: unless-stopped
    networks:
      - bicsn-prod-network

networks:
  bicsn-prod-network:
    driver: bridge

volumes:
  bicsn_prod_logs:
  bicsn_prod_archivosTmp:
  bicsn_prod_temp:
COMPOSE_PROD

if ! echo "$SSH_PASS" | sudo -S docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
  echo "$SSH_PASS" | sudo -S apt-get update
  (echo "$SSH_PASS" | sudo -S apt-get install -y docker-compose-v2) || (echo "$SSH_PASS" | sudo -S apt-get install -y docker-compose)
fi

if test -f "$PRIVATE_DIR/docker-compose.yml"; then
  cd "$PRIVATE_DIR"
  if echo "$SSH_PASS" | sudo -S docker compose version >/dev/null 2>&1; then
    echo "$SSH_PASS" | sudo -S docker compose -p privado down || true
  else
    echo "$SSH_PASS" | sudo -S docker-compose -p privado down || true
  fi
fi

if echo "$SSH_PASS" | sudo -S docker compose version >/dev/null 2>&1; then
  cd "$DEV_DIR" && echo "$SSH_PASS" | sudo -S docker compose -p bicsn-des up -d --build
  cd "$PROD_DIR" && echo "$SSH_PASS" | sudo -S docker compose -p bicsn-prod up -d --build
else
  cd "$DEV_DIR" && echo "$SSH_PASS" | sudo -S docker-compose -p bicsn-des up -d --build
  cd "$PROD_DIR" && echo "$SSH_PASS" | sudo -S docker-compose -p bicsn-prod up -d --build
fi
