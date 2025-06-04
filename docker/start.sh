#!/bin/bash
# Startup script for motea with embedded PostgreSQL
# Based on the open-source project Notea, originally created by qingwei-li<cinwell.li@gmail.com>
# Modified and maintained by waycaan, 2025.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting motea with embedded PostgreSQL...${NC}"

# Function to log with timestamp
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Cleanup function
cleanup() {
    log "Shutting down services..."
    if [ ! -z "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
        wait $APP_PID 2>/dev/null || true
    fi
    if [ ! -z "$PG_PID" ]; then
        su-exec postgres pg_ctl -D "$PGDATA" stop -m fast || true
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Initialize database if needed
log "Initializing database..."
/docker-entrypoint-initdb.d/init-db.sh

# Start PostgreSQL
log "Starting PostgreSQL..."
su-exec postgres pg_ctl -D "$PGDATA" -l "$PGDATA/logfile" start &
PG_PID=$!

# Wait for PostgreSQL to be ready
log "Waiting for PostgreSQL to be ready..."
for i in {1..60}; do
    if su-exec postgres pg_isready -q; then
        log "PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        error "PostgreSQL failed to start within 60 seconds"
        exit 1
    fi
    sleep 1
done

# Test database connection
log "Testing database connection..."
if ! su-exec postgres psql -d motea -U motea -c "SELECT 1;" > /dev/null 2>&1; then
    error "Failed to connect to database"
    exit 1
fi

log "Database connection successful!"

# Load configuration from file if exists
if [ -f "/app/motea.conf" ]; then
    log "Loading configuration from motea.conf..."
    set -a  # automatically export all variables
    source /app/motea.conf
    set +a
    log "Configuration loaded successfully"
else
    log "No motea.conf found, using environment variables"
fi

# Set environment variables for the application
export DATABASE_URL="postgresql://motea:motea@localhost:5432/motea"
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"

# Set default password if not provided
if [ -z "$PASSWORD" ] && [ "$DISABLE_PASSWORD" != "true" ]; then
    export PASSWORD="motea"
    warn "No PASSWORD set, using default password 'motea'. Please create motea.conf file or set PASSWORD environment variable for production use."
fi

# Start the application
log "Starting motea application..."
cd /app
su-exec nextjs node server.js &
APP_PID=$!

log "motea started successfully!"
log "Application: http://localhost:3000"
log "Database: postgresql://motea:motea@localhost:5432/motea"

# Wait for either process to exit
wait $APP_PID
