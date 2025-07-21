# =============================================================================
# Multi-stage Dockerfile for Node.js Application
# =============================================================================
# This Dockerfile creates optimized, secure, and efficient containers for:
# 1. Development environment with hot-reload and debugging
# 2. Production environment with minimal footprint and security hardening
# 3. Testing environment with all testing dependencies
# =============================================================================

# -----------------------------------------------------------------------------
# Base Stage - Shared foundation for all environments
# -----------------------------------------------------------------------------
FROM node:22-alpine AS base

# Set build arguments for configuration
ARG UID=1000
ARG GID=1000

# Install security updates and required system packages
RUN apk update
RUN apk upgrade
RUN apk add --no-cache \
        dumb-init \
        curl \
        bash \
        git
RUN rm -rf /var/cache/apk/*

# Create application directory
WORKDIR /app

# Create non-root user for security with robust error handling
RUN set -e; \
    # Check if group already exists, if not create it
    if ! getent group appgroup >/dev/null 2>&1; then \
        if ! addgroup -g ${GID} -S appgroup 2>/dev/null; then \
            addgroup -S appgroup; \
        fi; \
    fi; \
    # Check if user already exists, if not create it
    if ! getent passwd appuser >/dev/null 2>&1; then \
        if ! adduser -u ${UID} -S -G appgroup -s /bin/sh appuser 2>/dev/null; then \
            # If the specific UID is taken, create user without specifying UID
            adduser -S -G appgroup -s /bin/sh appuser; \
        fi; \
    fi
RUN mkdir -p logs tmp uploads
RUN chown -R appuser:appgroup /app

# Copy package files for dependency caching
COPY --chown=appuser:appgroup package*.json ./

# -----------------------------------------------------------------------------
# Dependencies Stage - Production dependencies only
# -----------------------------------------------------------------------------
FROM base AS dependencies

# Install production dependencies only
RUN if [ -f package-lock.json ]; then \
        npm ci --only=production --no-audit --no-fund; \
    else \
        npm install --only=production --no-audit --no-fund; \
    fi
RUN npm cache clean --force

# -----------------------------------------------------------------------------
# Dev Dependencies Stage - All dependencies + dev tools
# -----------------------------------------------------------------------------
FROM base AS dev-dependencies

# Add vim for development convenience
RUN apk add --no-cache vim

# Install all dependencies and global tools in fewer layers
RUN if [ -f package-lock.json ]; then \
        npm ci --no-audit --no-fund; \
    else \
        npm install --no-audit --no-fund; \
    fi
RUN npm install -g nodemon pm2
RUN npm cache clean --force

# -----------------------------------------------------------------------------
# Development Stage - Hot-reload development environment
# -----------------------------------------------------------------------------
FROM dev-dependencies AS development

# Set environment variables for development
ENV NODE_ENV=development
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Copy source code with proper ownership
COPY --chown=appuser:appgroup . .

# Switch to non-root user for security
USER appuser

# Expose development port
EXPOSE 3000

# Health check for development container
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly and start development server
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Testing Stage - Environment for running tests
# -----------------------------------------------------------------------------
FROM dev-dependencies AS testing

# Set environment variables for testing
ENV NODE_ENV=test
ENV CI=true

# Copy source code
COPY --chown=appuser:appgroup . .

# Change to non-root user
USER appuser

# Default command for testing
CMD ["npm", "run", "test"]

# -----------------------------------------------------------------------------
# Production Build Stage - Clean production build
# -----------------------------------------------------------------------------
FROM dependencies AS build

# Set production environment
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=error

# Copy source code
COPY --chown=appuser:appgroup . .

# Remove development files to minimize size
RUN rm -rf \
    tests/ \
    docs/ \
    *.md \
    .eslintrc* \
    .prettierrc* \
    jest.config.js \
    .dockerignore \
    Dockerfile* \
    docker-compose*.yml

# -----------------------------------------------------------------------------
# Production Stage - Minimal runtime environment
# -----------------------------------------------------------------------------
FROM node:22-alpine AS production

# Install only essential runtime packages and security updates
RUN apk update
RUN apk upgrade
RUN apk add --no-cache \
        dumb-init \
        curl
RUN rm -rf /var/cache/apk/*

# Create non-root user for production with robust error handling
RUN set -e; \
    if ! getent group appgroup >/dev/null 2>&1; then \
        if ! addgroup -g 1000 -S appgroup 2>/dev/null; then \
            addgroup -S appgroup; \
        fi; \
    fi; \
    if ! getent passwd appuser >/dev/null 2>&1; then \
        if ! adduser -u 1000 -S -G appgroup -s /bin/sh appuser 2>/dev/null; then \
            adduser -S -G appgroup -s /bin/sh appuser; \
        fi; \
    fi

# Set working directory
WORKDIR /app

# Copy built application from build stage
COPY --from=build --chown=appuser:appgroup /app .

# Create necessary directories for runtime
RUN mkdir -p logs tmp uploads
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set production environment variables
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=error
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Expose production port
EXPOSE 3000

# Health check for production container
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start production server with proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# -----------------------------------------------------------------------------
# Production with PM2 Stage - Advanced process management
# -----------------------------------------------------------------------------
FROM production AS production-pm2

# Install PM2 globally (temporarily switch to root)
USER root
RUN npm install -g pm2
RUN npm cache clean --force
USER appuser

# Copy PM2 configuration
COPY --chown=appuser:appgroup ecosystem.config.js ./

# Use PM2 to manage the application
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

# -----------------------------------------------------------------------------
# Nginx Reverse Proxy Stage - Load balancer and reverse proxy
# -----------------------------------------------------------------------------
FROM nginx:mainline-alpine3.22 AS nginx

# Install security updates and basic tools
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        curl \
        bash && \
    rm -rf /var/cache/apk/*

# Create nginx user with proper permissions
RUN addgroup -g 1000 -S nginx-app && \
    adduser -u 1000 -D -S -G nginx-app nginx-app

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY --chown=nginx-app:nginx-app nginx.conf /etc/nginx/nginx.conf

# Create necessary directories
RUN mkdir -p /var/log/nginx /var/cache/nginx /tmp/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx /var/cache/nginx /tmp/nginx /etc/nginx

# Set proper permissions for nginx directories
RUN chmod -R 755 /var/log/nginx /var/cache/nginx /tmp/nginx

# Switch to non-root user
USER nginx-app

# Expose HTTP port
EXPOSE 80

# Health check for nginx
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost/health || curl -f http://localhost/nginx-status || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

# -----------------------------------------------------------------------------
# Production with Nginx Stage - Node.js app behind nginx reverse proxy
# -----------------------------------------------------------------------------
FROM nginx:mainline-alpine3.22 AS production-nginx

# Install security updates and essential tools
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
        curl \
        bash \
        supervisor && \
    rm -rf /var/cache/apk/*

# Install Node.js for running the app alongside nginx
RUN apk add --no-cache nodejs npm

# Create application user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -D -S -G appgroup appuser

# Set working directory
WORKDIR /app

# Copy built application from build stage
COPY --from=build --chown=appuser:appgroup /app .

# Copy nginx configuration
COPY --chown=appuser:appgroup nginx.conf /etc/nginx/nginx.conf

# Remove default nginx configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Create supervisor configuration for managing both nginx and node
RUN mkdir -p /etc/supervisor/conf.d
COPY --chown=root:root <<EOF /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:nodejs]
command=npm start
directory=/app
user=appuser
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/nodejs.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=3

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/nginx.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=3
EOF

# Create necessary directories
RUN mkdir -p /var/log/supervisor /var/log/nginx /var/cache/nginx /tmp/nginx logs uploads && \
    chown -R appuser:appgroup /app/logs /app/uploads && \
    chmod -R 755 /var/log/nginx /var/cache/nginx /tmp/nginx

# Set production environment
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=error
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Expose HTTP port (nginx will proxy to Node.js on 3000)
EXPOSE 80

# Health check for the combined container
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start supervisor to manage both services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# -----------------------------------------------------------------------------
# Metadata Labels for Container Management
# -----------------------------------------------------------------------------
LABEL maintainer="LynxPardelle <lynxpardelle@lynxpardelle.com>"
LABEL version="1.0.0"
LABEL description="Node.js Docker Template"
LABEL org.opencontainers.image.title="Node.js Docker Template"
LABEL org.opencontainers.image.description="Node.js application with Express.js and production optimizations"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="LynxPardelle"
LABEL org.opencontainers.image.url="https://lynxpardelle.com"
LABEL org.opencontainers.image.source="https://github.com/LynxPardelle/node-docker-template"
LABEL org.opencontainers.image.licenses="MIT"
