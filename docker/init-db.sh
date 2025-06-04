#!/bin/bash
# Database initialization script for motea
# Based on the open-source project Notea, originally created by qingwei-li<cinwell.li@gmail.com>
# Modified and maintained by waycaan, 2025.

set -e

# Database configuration
DB_NAME="motea"
DB_USER="motea"
DB_PASSWORD="motea"

echo "Initializing PostgreSQL database for motea..."

# Initialize database if not exists
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "Initializing PostgreSQL data directory..."
    su-exec postgres initdb -D "$PGDATA" --auth-local=trust --auth-host=md5
    
    # Start PostgreSQL temporarily for setup
    su-exec postgres pg_ctl -D "$PGDATA" -l "$PGDATA/logfile" start
    
    # Wait for PostgreSQL to start
    echo "Waiting for PostgreSQL to start..."
    for i in {1..30}; do
        if su-exec postgres pg_isready -q; then
            break
        fi
        sleep 1
    done
    
    # Create database and user
    echo "Creating database and user..."
    su-exec postgres psql -v ON_ERROR_STOP=1 <<-EOSQL
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
        CREATE DATABASE $DB_NAME OWNER $DB_USER;
        GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
        
        -- Connect to the motea database and set up permissions
        \c $DB_NAME
        GRANT ALL ON SCHEMA public TO $DB_USER;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOSQL
    
    # Stop PostgreSQL
    su-exec postgres pg_ctl -D "$PGDATA" stop
    
    echo "Database initialization completed."
else
    echo "PostgreSQL data directory already exists, skipping initialization."
fi

# Configure PostgreSQL
echo "Configuring PostgreSQL..."
cat >> "$PGDATA/postgresql.conf" <<EOF

# motea configuration
listen_addresses = '*'
port = 5432
max_connections = 20
shared_buffers = 32MB
effective_cache_size = 128MB
work_mem = 4MB
maintenance_work_mem = 16MB
checkpoint_completion_target = 0.9
wal_buffers = 1MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
min_wal_size = 80MB
max_wal_size = 1GB

# Logging
log_destination = 'stderr'
logging_collector = off
log_min_messages = warning
log_min_error_statement = error
log_min_duration_statement = 1000

# Performance
fsync = on
synchronous_commit = on
full_page_writes = on
EOF

# Configure authentication
cat > "$PGDATA/pg_hba.conf" <<EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                trust
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
host    all             all             0.0.0.0/0               md5
EOF

echo "PostgreSQL configuration completed."
