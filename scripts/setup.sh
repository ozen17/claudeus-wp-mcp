#!/bin/bash

# Claudeus WordPress AI Assistant SaaS - Setup Script

set -e

echo "🚀 Claudeus WordPress AI Assistant SaaS - Setup"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env

    # Generate secure secrets
    echo ""
    echo "🔐 Generating secure secrets..."

    JWT_ACCESS=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    JWT_REFRESH=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")

    # Update .env file (macOS compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-super-secret-access-key-change-in-production-at-least-32-chars/$JWT_ACCESS/" .env
        sed -i '' "s/your-super-secret-refresh-key-change-in-production-at-least-32-chars/$JWT_REFRESH/" .env
        sed -i '' "s/changeme32charactersencryptionk/$ENCRYPTION_KEY/" .env
    else
        sed -i "s/your-super-secret-access-key-change-in-production-at-least-32-chars/$JWT_ACCESS/" .env
        sed -i "s/your-super-secret-refresh-key-change-in-production-at-least-32-chars/$JWT_REFRESH/" .env
        sed -i "s/changeme32charactersencryptionk/$ENCRYPTION_KEY/" .env
    fi

    echo "✅ .env file created with secure secrets"
else
    echo "ℹ️  .env file already exists, skipping..."
fi

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🗄️  Setting up database..."
cd packages/backend

# Generate Prisma client
pnpm prisma:generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Configure your Stripe keys in .env (optional):"
echo "   - Get keys from https://dashboard.stripe.com"
echo ""
echo "2. Start the services:"
echo "   - Docker: make docker-up"
echo "   - Manual: make dev"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:3001"
echo ""
echo "Happy coding! 🚀"
