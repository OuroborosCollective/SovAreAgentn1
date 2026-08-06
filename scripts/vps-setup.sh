#!/bin/bash
# ============================================
# N+1 SovAreAgentn1 - VPS Setup Script
# Für PostgreSQL Datenbank auf dem VPS
# ============================================

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} N+1 SovAreAgentn1 - VPS Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Konfiguration
DB_NAME="${DB_NAME:-n1_sovareagentn1}"
DB_USER="${DB_USER:-n1_app}"
DB_PASS="${DB_PASS:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo -e "\n${YELLOW}Konfiguration:${NC}"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"

# Prüfe ob PostgreSQL läuft
echo -e "\n${YELLOW}Prüfe PostgreSQL...${NC}"
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
    echo -e "${RED}FEHLER: PostgreSQL läuft nicht auf $DB_HOST:$DB_PORT${NC}"
    echo "Bitte installiere PostgreSQL und starte es:"
    echo "  apt install postgresql postgresql-contrib"
    echo "  systemctl start postgresql"
    echo "  systemctl enable postgresql"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL läuft${NC}"

# Datenbank erstellen
echo -e "\n${YELLOW}Erstelle Datenbank...${NC}"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Datenbank existiert bereits"
echo -e "${GREEN}✓ Datenbank erstellt${NC}"

# User erstellen
if [ -n "$DB_PASS" ]; then
    echo -e "\n${YELLOW}Erstelle User...${NC}"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || echo "User existiert bereits"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    echo -e "${GREEN}✓ User erstellt${NC}"
fi

# Schema anwenden
echo -e "\n${YELLOW}Wende Schema an...${NC}"
sudo -u postgres psql -d "$DB_NAME" -f "$(dirname "$0")/vps-setup.sql"
echo -e "${GREEN}✓ Schema angewendet${NC}"

# Berechtigungen
echo -e "\n${YELLOW}Setze Berechtigungen...${NC}"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
echo -e "${GREEN}✓ Berechtigungen gesetzt${NC}"

# Environment-Vorlage erstellen
echo -e "\n${YELLOW}Erstelle .env Vorlage...${NC}"
cat > "$(dirname "$0")/../.env.vps.example" << 'EOF'
# PostgreSQL Datenbank
DATABASE_URL=postgresql://n1_app:DEIN_PASSWORT@localhost:5432/n1_sovareagentn1
DB_HOST=localhost
DB_PORT=5432
DB_NAME=n1_sovareagentn1
DB_USER=n1_app
DB_PASS=DEIN_PASSWORT

# Optional: Redis für Session-Cache
# REDIS_URL=redis://localhost:6379

# Server
PORT=3001
NODE_ENV=production
EOF
echo -e "${GREEN}✓ .env.vps.example erstellt${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN} Setup abgeschlossen!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${YELLOW}Nächste Schritte:${NC}"
echo "1. Kopiere .env.vps.example nach .env und passe die Werte an"
echo "2. Starte die App mit: npm run build && npm start"
echo "3. Prüfe die Health-Endpoint: curl http://localhost:3001/api/health"
