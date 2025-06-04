# Dockerfile for motea with embedded PostgreSQL
# Based on the open-source project Notea, originally created by qingwei-li<cinwell.li@gmail.com>
# Modified and maintained by waycaan, 2025.

# Build arguments
ARG BUILDTIME
ARG VERSION
ARG REVISION

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat

# Copy package files and npm configuration
COPY package.json .npmrc ./

# Install production dependencies only
RUN npm install --only=production --ignore-scripts && npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies needed for building
RUN apk add --no-cache libc6-compat

# Copy package files and npm configuration
COPY package.json .npmrc ./

# Install all dependencies (including devDependencies)
RUN npm install --ignore-scripts && npm cache clean --force

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Stage 3: Runner with PostgreSQL
FROM node:18-alpine AS runner
WORKDIR /app

# Install PostgreSQL and other runtime dependencies
RUN apk add --no-cache \
    postgresql \
    postgresql-contrib \
    dumb-init \
    curl \
    bash \
    su-exec \
    && rm -rf /var/cache/apk/*

# Create users and directories
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /var/lib/postgresql/data && \
    mkdir -p /var/run/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql && \
    chown -R postgres:postgres /var/run/postgresql

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy health check script
COPY --from=builder /app/healthcheck.js ./

# Copy production dependencies (only if needed by standalone build)
# COPY --from=deps /app/node_modules ./node_modules

# Create database initialization script
COPY docker/init-db.sh /docker-entrypoint-initdb.d/
COPY docker/start.sh /usr/local/bin/
RUN chmod +x /docker-entrypoint-initdb.d/init-db.sh && \
    chmod +x /usr/local/bin/start.sh

# Set correct permissions for app
RUN chown -R nextjs:nodejs /app

# Create data directory and set permissions
RUN mkdir -p /data && \
    chown -R postgres:postgres /data

# Expose ports
EXPOSE 3000 5432

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV PGDATA=/data
ENV DATABASE_URL=postgresql://motea:motea@localhost:5432/motea

# Add build metadata as labels
LABEL org.opencontainers.image.title="motea"
LABEL org.opencontainers.image.description="A note-taking application with embedded PostgreSQL based on Notea"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILDTIME}"
LABEL org.opencontainers.image.revision="${REVISION}"
LABEL org.opencontainers.image.source="https://github.com/waycaan/motea-docker"
LABEL org.opencontainers.image.authors="waycaan"
LABEL org.opencontainers.image.licenses="MIT"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start both PostgreSQL and the application
CMD ["/usr/local/bin/start.sh"]
