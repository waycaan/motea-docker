# Makefile for motea Docker operations
# waycaan mit, 2025

# Variables
IMAGE_NAME ?= motea
TAG ?= latest
REGISTRY ?= ghcr.io/your-username/notea
FULL_IMAGE_NAME = $(IMAGE_NAME):$(TAG)
REGISTRY_IMAGE_NAME = $(REGISTRY)/$(IMAGE_NAME):$(TAG)

# Build information
BUILD_TIME = $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
VERSION = $(TAG)
REVISION = $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Build arguments
BUILD_ARGS = --build-arg BUILDTIME=$(BUILD_TIME) \
             --build-arg VERSION=$(VERSION) \
             --build-arg REVISION=$(REVISION)

.PHONY: help build build-local build-multi push run stop clean logs health test

# Default target
help: ## Show this help message
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker image for local platform
	@echo "Building $(FULL_IMAGE_NAME) for local platform..."
	docker build $(BUILD_ARGS) -t $(FULL_IMAGE_NAME) .

build-local: build ## Alias for build

build-multi: ## Build Docker image for multiple platforms (requires buildx)
	@echo "Building $(FULL_IMAGE_NAME) for multiple platforms..."
	docker buildx build $(BUILD_ARGS) \
		--platform linux/amd64,linux/arm64 \
		-t $(FULL_IMAGE_NAME) \
		--load .

build-push: ## Build and push Docker image to registry
	@echo "Building and pushing $(REGISTRY_IMAGE_NAME)..."
	docker buildx build $(BUILD_ARGS) \
		--platform linux/amd64,linux/arm64 \
		-t $(REGISTRY_IMAGE_NAME) \
		--push .

push: ## Push Docker image to registry
	@echo "Pushing $(REGISTRY_IMAGE_NAME)..."
	docker tag $(FULL_IMAGE_NAME) $(REGISTRY_IMAGE_NAME)
	docker push $(REGISTRY_IMAGE_NAME)

run: ## Run Docker container
	@echo "Running $(FULL_IMAGE_NAME)..."
	docker run -d \
		--name motea \
		-p 3000:3000 \
		--env-file .env.local \
		$(FULL_IMAGE_NAME)

run-dev: ## Run Docker container with development settings
	@echo "Running $(FULL_IMAGE_NAME) in development mode..."
	docker run -d \
		--name motea-dev \
		-p 3000:3000 \
		-e NODE_ENV=development \
		-e DISABLE_PASSWORD=true \
		$(FULL_IMAGE_NAME)

stop: ## Stop and remove Docker container
	@echo "Stopping motea container..."
	-docker stop motea motea-dev 2>/dev/null
	-docker rm motea motea-dev 2>/dev/null

clean: stop ## Clean up Docker images and containers
	@echo "Cleaning up Docker images..."
	-docker rmi $(FULL_IMAGE_NAME) 2>/dev/null
	-docker system prune -f

logs: ## Show container logs
	docker logs -f motea

health: ## Check container health
	@echo "Checking container health..."
	@docker ps --filter name=motea --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "Health endpoint test:"
	@curl -f http://localhost:3000/api/health 2>/dev/null | jq . || echo "Health check failed"

test: ## Test Docker image
	@echo "Testing $(FULL_IMAGE_NAME)..."
	docker run --rm \
		-e NODE_ENV=production \
		-e DISABLE_PASSWORD=true \
		$(FULL_IMAGE_NAME) \
		node -e "console.log('Image test passed')"

test-deps: ## Test dependency resolution
	@echo "Testing dependency resolution..."
	@if command -v bash >/dev/null 2>&1; then \
		bash ../test-dependency-fix.sh; \
	else \
		powershell -ExecutionPolicy Bypass -File ../test-dependency-fix.ps1; \
	fi

compose-up: ## Start services with Docker Compose
	docker-compose up -d

compose-down: ## Stop services with Docker Compose
	docker-compose down

compose-logs: ## Show Docker Compose logs
	docker-compose logs -f

# Development targets
dev-setup: ## Setup development environment
	@echo "Setting up development environment..."
	cp .env.example .env.local
	@echo "Please edit .env.local with your configuration"
	@echo "Or use: make config-setup"

dev-build: ## Build development image
	$(MAKE) build TAG=dev

dev-run: ## Run development container
	$(MAKE) run-dev TAG=dev

# Configuration management targets
config-setup: ## Interactive configuration setup
	@echo "Starting configuration manager..."
	node scripts/config-manager.js

config-validate: ## Validate current configuration
	@echo "Validating configuration..."
	node scripts/validate-config.js

config-neon: ## Quick setup for Neon PostgreSQL
	@echo "Setting up Neon PostgreSQL configuration..."
	cp config/env.neon.example .env.local
	@echo "Please edit .env.local with your Neon database URL"

config-supabase: ## Quick setup for Supabase PostgreSQL
	@echo "Setting up Supabase PostgreSQL configuration..."
	cp config/env.supabase.example .env.local
	@echo "Please edit .env.local with your Supabase database URL"

config-self-hosted: ## Quick setup for self-hosted PostgreSQL
	@echo "Setting up self-hosted PostgreSQL configuration..."
	cp config/env.self-hosted.example .env.local
	@echo "Please edit .env.local with your database URL"

# CI/CD targets
ci-build: ## Build for CI/CD (multi-platform)
	$(MAKE) build-multi

ci-test: ## Run tests in CI/CD
	$(MAKE) test

ci-push: ## Push to registry in CI/CD
	$(MAKE) build-push

# Information targets
info: ## Show build information
	@echo "Image Name: $(FULL_IMAGE_NAME)"
	@echo "Registry: $(REGISTRY_IMAGE_NAME)"
	@echo "Build Time: $(BUILD_TIME)"
	@echo "Version: $(VERSION)"
	@echo "Revision: $(REVISION)"

images: ## List Docker images
	docker images $(IMAGE_NAME)

ps: ## Show running containers
	docker ps --filter name=motea
