# =============================================================================
# Makefile for Node.js Application
# =============================================================================
# This Makefile provides convenient commands for Docker-based development
# and deployment workflows with enhanced functionality
# =============================================================================

# Load environment variables from .env file if it exists
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# Set default values for environment variables
APP_NAME ?= my-node-app
DEV_PORT ?= 6164
PROD_PORT ?= 6165
UID ?= 1000
GID ?= 1000

# Colors for enhanced output formatting
CYAN=\033[0;36m
GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
BLUE=\033[0;34m
PURPLE=\033[0;35m
NC=\033[0m

# Default target when running 'make' without arguments
.DEFAULT_GOAL := help

# =============================================================================
# Help and Information Commands
# =============================================================================

help: ## Show this help message with all available commands
	@echo "$(CYAN)🐳 Node.js - Docker Management$(NC)"
	@echo "$(CYAN)============================================$(NC)"
	@echo ""
	@echo "$(GREEN)🎯 Project Setup:$(NC)"
	@echo "  create            - Create new Node.js project structure"
	@echo ""
	@echo "$(GREEN)🚀 Development Commands:$(NC)"
	@echo "  dev               - Start development server with hot-reload"
	@echo "  dev-detached      - Start development server in background"
	@echo "  dev-logs          - Show development container logs"
	@echo "  dev-shell         - Access development container shell"
	@echo ""
	@echo "$(GREEN)🏗️ Production Commands:$(NC)"
	@echo "  prod              - Start production server"
	@echo "  prod-detached     - Start production server (background)"
	@echo "  prod-pm2          - Start production server with PM2"
	@echo "  prod-pm2-detached - Start production with PM2 (background)"
	@echo "  prod-nginx        - Start production with nginx reverse proxy"
	@echo "  prod-nginx-detached - Start production with nginx (background)"
	@echo "  prod-logs         - Show production container logs"
	@echo ""
	@echo "$(GREEN)🌐 Nginx Commands:$(NC)"
	@echo "  nginx             - Start nginx reverse proxy with backend"
	@echo "  nginx-detached    - Start nginx reverse proxy (background)"
	@echo "  nginx-logs        - Show nginx container logs"
	@echo "  nginx-status      - Check nginx status and configuration"
	@echo "  nginx-reload      - Reload nginx configuration"
	@echo ""
	@echo "$(GREEN)📦 Package Management:$(NC)"
	@echo "  install           - Install package (use: make install pkg=package-name)"
	@echo "  install-dev       - Install dev package (use: make install-dev pkg=package-name)"
	@echo "  update            - Update all packages to latest versions"
	@echo ""
	@echo "$(GREEN)🔧 Container Management:$(NC)"
	@echo "  stop              - Stop all containers"
	@echo "  restart           - Restart containers"
	@echo "  clean             - Clean containers, volumes, and build cache"
	@echo "  rebuild           - Rebuild containers from scratch"
	@echo "  prune             - Remove unused Docker resources"
	@echo ""
	@echo "$(GREEN)📊 Monitoring & Debugging:$(NC)"
	@echo "  status            - Show container status and health"
	@echo "  logs              - Show container logs (all services)"
	@echo "  health            - Check container health status"
	@echo "  debug             - Debug application in development mode"
	@echo "  inspect           - Inspect container configuration"
	@echo ""
	@echo "$(GREEN)🧪 Testing & Quality:$(NC)"
	@echo "  test              - Run unit tests in container"
	@echo "  test-watch        - Run tests in watch mode"
	@echo "  test-coverage     - Run tests with coverage report"
	@echo "  lint              - Run linting checks"
	@echo "  lint-fix          - Run linting with auto-fix"
	@echo "  security          - Run security audit"
	@echo ""
	@echo "$(GREEN)💾 Backup & Restore:$(NC)"
	@echo "  backup            - Backup project data and configuration"
	@echo "  restore           - Restore from backup"
	@echo ""
	@echo "$(YELLOW)💡 Environment Variables (from .env):$(NC)"
	@echo "  APP_NAME: $(APP_NAME)"
	@echo "  DEV_PORT: $(DEV_PORT)"
	@echo "  PROD_PORT: $(PROD_PORT)"
	
# =============================================================================
# Create Commands
# =============================================================================

create: ## Create new Node.js project structure
	@echo "$(CYAN)🎯 Creating Node.js project structure...$(NC)"
	@if [ ! -d "./src" ]; then \
		echo "$(YELLOW)Initializing new project: $(APP_NAME)$(NC)"; \
		UID=$$(id -u) GID=$$(id -g) COMPOSE_DOCKER_CLI_BUILD=1 docker compose -p $(APP_NAME) --profile create up --build; \
		echo "$(GREEN)✅ Project created successfully$(NC)"; \
	else \
		echo "$(YELLOW)⚠️ Project already exists. Delete src/ folder to recreate$(NC)"; \
	fi

# =============================================================================
# Development Commands
# =============================================================================

dev: ## Start development server with hot-reload
	@echo "$(CYAN)🚀 Starting development server...$(NC)"
	@echo "$(YELLOW)Port: $(DEV_PORT) | Container: $(APP_NAME)-dev$(NC)"
	docker compose -p $(APP_NAME) --profile dev up --build

dev-detached: ## Start development server in background
	@echo "$(CYAN)🚀 Starting development server (background)...$(NC)"
	docker compose -p $(APP_NAME) --profile dev up --build -d
	@echo "$(GREEN)✅ Development server started on port $(DEV_PORT)$(NC)"

dev-logs: ## Show development container logs
	@echo "$(CYAN)📋 Development container logs:$(NC)"
	docker compose -p $(APP_NAME) logs -f dev

dev-shell: ## Access development container shell
	@echo "$(CYAN)🔧 Accessing development container shell...$(NC)"
	docker compose -p $(APP_NAME) exec dev sh

# =============================================================================
# Production Commands
# =============================================================================

prod: ## Start production server
	@echo "$(CYAN)🏗️ Starting production server...$(NC)"
	@echo "$(YELLOW)Port: $(PROD_PORT) | Container: $(APP_NAME)-prod$(NC)"
	docker compose -p $(APP_NAME) --profile prod up --build

prod-detached: ## Start production server in background
	@echo "$(CYAN)🏗️ Starting production server (background)...$(NC)"
	docker compose -p $(APP_NAME) --profile prod up --build -d
	@echo "$(GREEN)✅ Production server started on port $(PROD_PORT)$(NC)"

prod-pm2: ## Start production server with PM2
	@echo "$(CYAN)🏗️ Starting production server with PM2...$(NC)"
	@echo "$(YELLOW)Port: $(PROD_PORT) | Container: $(APP_NAME)-prod-pm2$(NC)"
	docker compose -p $(APP_NAME) --profile prod-pm2 up --build

prod-pm2-detached: ## Start production server with PM2 in background
	@echo "$(CYAN)🏗️ Starting production server with PM2 (background)...$(NC)"
	docker compose -p $(APP_NAME) --profile prod-pm2 up --build -d
	@echo "$(GREEN)✅ Production server with PM2 started on port $(PROD_PORT)$(NC)"

prod-logs: ## Show production container logs
	@echo "$(CYAN)📋 Production container logs:$(NC)"
	docker compose -p $(APP_NAME) logs -f prod

prod-shell: ## Access production container shell
	@echo "$(CYAN)🔧 Accessing production container shell...$(NC)"
	docker compose -p $(APP_NAME) exec prod sh

# =============================================================================
# Nginx Commands
# =============================================================================

nginx: ## Start nginx reverse proxy with backend
	@echo "$(CYAN)🌐 Starting nginx reverse proxy with backend...$(NC)"
	@echo "$(YELLOW)Port: ${NGINX_PORT:-80} | Containers: $(APP_NAME)-nginx, $(APP_NAME)-app$(NC)"
	docker compose -p $(APP_NAME) --profile nginx up --build

nginx-detached: ## Start nginx reverse proxy in background
	@echo "$(CYAN)🌐 Starting nginx reverse proxy (background)...$(NC)"
	docker compose -p $(APP_NAME) --profile nginx up --build -d
	@echo "$(GREEN)✅ Nginx reverse proxy started on port ${NGINX_PORT:-80}$(NC)"

prod-nginx: ## Start production with nginx reverse proxy
	@echo "$(CYAN)🏗️ Starting production with nginx reverse proxy...$(NC)"
	@echo "$(YELLOW)Port: ${NGINX_PORT:-80} | Container: $(APP_NAME)-prod-nginx$(NC)"
	docker compose -p $(APP_NAME) --profile prod-nginx up --build

prod-nginx-detached: ## Start production with nginx in background
	@echo "$(CYAN)🏗️ Starting production with nginx (background)...$(NC)"
	docker compose -p $(APP_NAME) --profile prod-nginx up --build -d
	@echo "$(GREEN)✅ Production with nginx started on port ${NGINX_PORT:-80}$(NC)"

nginx-logs: ## Show nginx container logs
	@echo "$(CYAN)📋 Nginx container logs:$(NC)"
	docker compose -p $(APP_NAME) logs -f nginx

nginx-status: ## Check nginx status and configuration
	@echo "$(CYAN)📊 Nginx status and configuration:$(NC)"
	@if docker compose -p $(APP_NAME) ps nginx | grep -q "Up"; then \
		echo "$(GREEN)✅ Nginx container is running$(NC)"; \
		docker compose -p $(APP_NAME) exec nginx nginx -t; \
		echo "$(CYAN)Nginx processes:$(NC)"; \
		docker compose -p $(APP_NAME) exec nginx ps aux | grep nginx; \
	else \
		echo "$(RED)❌ Nginx container is not running$(NC)"; \
	fi

nginx-reload: ## Reload nginx configuration
	@echo "$(CYAN)🔄 Reloading nginx configuration...$(NC)"
	@if docker compose -p $(APP_NAME) ps nginx | grep -q "Up"; then \
		docker compose -p $(APP_NAME) exec nginx nginx -s reload; \
		echo "$(GREEN)✅ Nginx configuration reloaded$(NC)"; \
	else \
		echo "$(RED)❌ Nginx container is not running$(NC)"; \
	fi

# =============================================================================
# Container Management Commands
# =============================================================================

stop: ## Stop all containers
	@echo "$(CYAN)🛑 Stopping all containers...$(NC)"
	docker compose -p $(APP_NAME) down

restart: ## Restart containers
	@echo "$(CYAN)🔄 Restarting containers...$(NC)"
	$(MAKE) stop
	$(MAKE) dev

clean: ## Clean containers, volumes, and build cache
	@echo "$(CYAN)🧹 Cleaning containers, volumes, and cache...$(NC)"
	docker compose -p $(APP_NAME) down --volumes --remove-orphans
	@if [ -d "node_modules" ]; then rm -rf node_modules; fi
	@if [ -f "package-lock.json" ]; then rm -f package-lock.json; fi
	@if [ -d "logs" ]; then rm -rf logs; fi
	@if [ -d "coverage" ]; then rm -rf coverage; fi
	@echo "$(GREEN)✅ Cleanup completed$(NC)"

rebuild: ## Rebuild containers from scratch
	@echo "$(CYAN)🔧 Rebuilding containers from scratch...$(NC)"
	$(MAKE) clean
	docker compose -p $(APP_NAME) build --no-cache
	@echo "$(GREEN)✅ Rebuild completed$(NC)"

prune: ## Remove unused Docker resources
	@echo "$(CYAN)🗑️ Removing unused Docker resources...$(NC)"
	docker system prune -f
	docker volume prune -f
	@echo "$(GREEN)✅ Docker cleanup completed$(NC)"

# =============================================================================
# Package Management Commands
# =============================================================================

install: ## Install package (use: make install pkg=package-name)
ifndef pkg
	@echo "$(RED)❌ Error: Package name required. Use: make install pkg=package-name$(NC)"
	@exit 1
endif
	@echo "$(CYAN)📦 Installing package: $(pkg)$(NC)"
	docker compose -p $(APP_NAME) exec dev npm install $(pkg)
	@echo "$(GREEN)✅ Package $(pkg) installed$(NC)"

install-dev: ## Install dev package (use: make install-dev pkg=package-name)
ifndef pkg
	@echo "$(RED)❌ Error: Package name required. Use: make install-dev pkg=package-name$(NC)"
	@exit 1
endif
	@echo "$(CYAN)📦 Installing dev package: $(pkg)$(NC)"
	docker compose -p $(APP_NAME) exec dev npm install --save-dev $(pkg)
	@echo "$(GREEN)✅ Dev package $(pkg) installed$(NC)"

update: ## Update all packages to latest versions
	@echo "$(CYAN)🔄 Updating all packages...$(NC)"
	docker compose -p $(APP_NAME) exec dev npm update
	@echo "$(GREEN)✅ Packages updated$(NC)"

# =============================================================================
# Monitoring & Debugging Commands
# =============================================================================

status: ## Show container status and health
	@echo "$(CYAN)📊 Container Status:$(NC)"
	docker compose -p $(APP_NAME) ps
	@echo ""
	@echo "$(CYAN)🏥 Health Status:$(NC)"
	@docker ps --filter "name=$(APP_NAME)" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

logs: ## Show container logs (all services)
	@echo "$(CYAN)📋 Container logs:$(NC)"
	docker compose -p $(APP_NAME) logs -f

health: ## Check container health status
	@echo "$(CYAN)🏥 Checking container health...$(NC)"
	@for container in $$(docker ps --filter "name=$(APP_NAME)" --format "{{.Names}}"); do \
		echo "$(BLUE)Checking $$container...$(NC)"; \
		docker inspect $$container --format='{{.State.Health.Status}}' 2>/dev/null || echo "No health check configured"; \
	done

debug: ## Debug application in development mode
	@echo "$(CYAN)🐛 Debug mode - starting development container with debugging...$(NC)"
	docker compose -p $(APP_NAME) exec dev npm run dev

inspect: ## Inspect container configuration
	@echo "$(CYAN)🔍 Container inspection:$(NC)"
	@for container in $$(docker ps --filter "name=$(APP_NAME)" --format "{{.Names}}"); do \
		echo "$(BLUE)Inspecting $$container...$(NC)"; \
		docker inspect $$container | jq '.[] | {Name: .Name, Image: .Config.Image, Ports: .NetworkSettings.Ports}' 2>/dev/null || echo "jq not available - showing basic info"; \
	done

# =============================================================================
# Testing & Quality Commands
# =============================================================================

test: ## Run unit tests in container
	@echo "$(CYAN)🧪 Running unit tests...$(NC)"
	docker compose -p $(APP_NAME) --profile test run --rm test npm test

test-watch: ## Run tests in watch mode
	@echo "$(CYAN)🧪 Running tests in watch mode...$(NC)"
	docker compose -p $(APP_NAME) exec dev npm run test:watch

test-coverage: ## Run tests with coverage report
	@echo "$(CYAN)🧪 Running tests with coverage...$(NC)"
	docker compose -p $(APP_NAME) --profile test run --rm test npm run test:coverage

lint: ## Run linting checks
	@echo "$(CYAN)🔍 Running linting checks...$(NC)"
	docker compose -p $(APP_NAME) exec dev npm run lint

lint-fix: ## Run linting with auto-fix
	@echo "$(CYAN)🔧 Running linting with auto-fix...$(NC)"
	docker compose -p $(APP_NAME) exec dev npm run lint:fix

security: ## Run security audit
	@echo "$(CYAN)🔒 Running security audit...$(NC)"
	docker compose -p $(APP_NAME) exec dev npm audit
	@echo "$(YELLOW)For automatic fixes, run: make security-fix$(NC)"

security-fix: ## Fix security vulnerabilities automatically
	@echo "$(CYAN)🔧 Fixing security vulnerabilities...$(NC)"
	docker compose -p $(APP_NAME) exec dev npm audit fix

# =============================================================================
# Backup & Restore Commands
# =============================================================================

backup: ## Run mongo-backup service for automated backups
	@echo "$(CYAN)💾 Running mongo-backup service...$(NC)"
	docker compose -p $(APP_NAME) --profile backup up --build mongo-backup

backup-detached: ## Run mongo-backup service in background
	@echo "$(CYAN)💾 Running mongo-backup service (background)...$(NC)"
	docker compose -p $(APP_NAME) --profile backup up --build -d mongo-backup
	@echo "$(GREEN)✅ Mongo-backup service started$(NC)"

backup-logs: ## Show mongo-backup container logs
	@echo "$(CYAN)📋 Mongo-backup container logs:$(NC)"
	docker compose -p $(APP_NAME) logs -f mongo-backup

restore: ## Restore MongoDB from S3 backup
	@echo "$(CYAN)📂 Restoring MongoDB from S3 backup...$(NC)"
	docker compose -p $(APP_NAME) exec mongo-backup bash /scripts/restore_mongo_from_s3.sh
	@echo "$(GREEN)✅ Restore script executed$(NC)"

weekly-backup-cron: ## Run weekly backup cron script manually
	@echo "$(CYAN)🕒 Running weekly backup cron script...$(NC)"
	docker compose -p $(APP_NAME) exec mongo-backup bash /scripts/weekly_backup_cron.sh
	@echo "$(GREEN)✅ Weekly backup cron script executed$(NC)"

# =============================================================================
# API Testing Commands
# =============================================================================

api-test: ## Test API endpoints
	@echo "$(CYAN)🌐 Testing API endpoints...$(NC)"
	@if docker ps --filter "name=$(APP_NAME)-dev" --format "{{.Names}}" | grep -q "$(APP_NAME)-dev"; then \
		echo "$(GREEN)Testing health endpoint...$(NC)"; \
		curl -s http://localhost:$(DEV_PORT)/health | jq . || echo "jq not available - raw response:"; \
		curl -s http://localhost:$(DEV_PORT)/health; \
		echo ""; \
		echo "$(GREEN)Testing API status...$(NC)"; \
		curl -s http://localhost:$(DEV_PORT)/api/status | jq . || echo "jq not available - raw response:"; \
		curl -s http://localhost:$(DEV_PORT)/api/status; \
		echo ""; \
	else \
		echo "$(RED)❌ Development container not running. Start with: make dev-detached$(NC)"; \
	fi

# =============================================================================
# Utility Functions
# =============================================================================

# Check if required tools are installed
check-tools: ## Check if required tools are installed
	@echo "$(CYAN)🔍 Checking required tools...$(NC)"
	@command -v docker >/dev/null 2>&1 || (echo "$(RED)❌ Docker not found$(NC)" && exit 1)
	@command -v docker compose >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || (echo "$(RED)❌ Docker Compose not found$(NC)" && exit 1)
	@echo "$(GREEN)✅ All required tools are installed$(NC)"

# Environment information
env-info: ## Display environment information
	@echo "$(CYAN)🌍 Environment Information:$(NC)"
	@echo "Project Name: $(APP_NAME)"
	@echo "Dev Port: $(DEV_PORT)"
	@echo "Prod Port: $(PROD_PORT)"
	@echo "UID: $(UID)"
	@echo "GID: $(GID)"
	@echo "Node Environment: $${NODE_ENV:-development}"

# Performance monitoring
perf: ## Show container performance stats
	@echo "$(CYAN)📈 Container Performance Stats:$(NC)"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" | grep $(APP_NAME) || echo "No containers running"

# Mark all targets as PHONY to avoid conflicts with file names
.PHONY: help create dev dev-detached dev-logs dev-shell prod prod-detached prod-pm2 prod-pm2-detached prod-logs prod-shell \
        nginx nginx-detached prod-nginx prod-nginx-detached nginx-logs nginx-status nginx-reload \
        stop restart clean rebuild prune install install-dev update status logs health debug inspect \
        test test-watch test-coverage lint lint-fix security security-fix backup restore api-test \
        check-tools env-info perf backup backup-detached backup-logs restore weekly-backup-cron
