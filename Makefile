.PHONY: help install build dev docker-up docker-down docker-logs clean

# Default target
help:
	@echo "Claudeus WordPress AI Assistant SaaS - Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install        - Install all dependencies"
	@echo "  make dev            - Start development servers"
	@echo "  make build          - Build all packages"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up      - Start all Docker services"
	@echo "  make docker-down    - Stop all Docker services"
	@echo "  make docker-logs    - View Docker logs"
	@echo "  make docker-rebuild - Rebuild and restart Docker services"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate     - Run database migrations"
	@echo "  make db-studio      - Open Prisma Studio"
	@echo "  make db-reset       - Reset database (WARNING: destroys data)"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make lint           - Run linters"
	@echo "  make test           - Run tests"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	pnpm install

# Build all packages
build:
	@echo "🔨 Building packages..."
	cd packages/backend && pnpm prisma:generate && pnpm build

# Start development servers
dev:
	@echo "🚀 Starting development servers..."
	@echo "Backend: http://localhost:3001"
	@echo "MCP Server: http://localhost:3002"
	@echo ""
	pnpm dev

# Docker commands
docker-up:
	@echo "🐳 Starting Docker services..."
	docker-compose up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:3001"
	@echo "PostgreSQL: localhost:5432"
	@echo "Redis: localhost:6379"

docker-down:
	@echo "🛑 Stopping Docker services..."
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-rebuild:
	@echo "🔄 Rebuilding Docker services..."
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# Database commands
db-migrate:
	@echo "🗄️  Running database migrations..."
	cd packages/backend && pnpm prisma:migrate

db-studio:
	@echo "🎨 Opening Prisma Studio..."
	cd packages/backend && pnpm prisma:studio

db-reset:
	@echo "⚠️  WARNING: This will destroy all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd packages/backend && npx prisma migrate reset; \
	fi

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf packages/backend/dist
	rm -rf packages/backend/node_modules
	rm -rf node_modules
	rm -rf packages/backend/logs/*.log

# Run linters
lint:
	@echo "🔍 Running linters..."
	cd packages/backend && pnpm lint

# Run tests
test:
	@echo "🧪 Running tests..."
	cd packages/backend && pnpm test
