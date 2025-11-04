#!/bin/bash

# ============================================
# Claudeus WordPress AI Assistant SaaS
# Quality Assurance Check Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Functions
print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -e "${YELLOW}[CHECK $TOTAL_CHECKS]${NC} $1..."
}

print_pass() {
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo -e "${GREEN}✓ PASS:${NC} $1"
    echo ""
}

print_fail() {
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo -e "${RED}✗ FAIL:${NC} $1"
    echo ""
}

print_warning() {
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
    echo -e "${YELLOW}⚠ WARNING:${NC} $1"
    echo ""
}

print_summary() {
    echo ""
    print_header "QA CHECK SUMMARY"
    echo -e "Total checks: ${BLUE}$TOTAL_CHECKS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
    echo -e "Warnings: ${YELLOW}$WARNING_CHECKS${NC}"
    echo ""

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "${GREEN}🎉 All critical checks passed! Ready for deployment.${NC}"
        exit 0
    else
        echo -e "${RED}❌ $FAILED_CHECKS critical issue(s) found. Fix them before deployment.${NC}"
        exit 1
    fi
}

# ============================================
# 1. ENVIRONMENT & DEPENDENCIES
# ============================================

print_header "1. ENVIRONMENT & DEPENDENCIES"

# Check Node.js
print_check "Node.js installation"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_pass "Node.js installed: $NODE_VERSION"
else
    print_fail "Node.js not installed"
fi

# Check Docker
print_check "Docker installation"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_pass "Docker installed: $DOCKER_VERSION"
else
    print_fail "Docker not installed"
fi

# Check Docker Compose
print_check "Docker Compose installation"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_pass "Docker Compose installed: $COMPOSE_VERSION"
else
    print_fail "Docker Compose not installed"
fi

# Check pnpm
print_check "pnpm installation"
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    print_pass "pnpm installed: $PNPM_VERSION"
else
    print_warning "pnpm not installed (optional, but recommended)"
fi

# ============================================
# 2. PROJECT STRUCTURE
# ============================================

print_header "2. PROJECT STRUCTURE"

# Check critical files
print_check "Critical project files"
CRITICAL_FILES=(
    "docker-compose.yml"
    ".env.example"
    "pnpm-workspace.yaml"
    "packages/backend/package.json"
    "packages/frontend/package.json"
    "packages/shared/package.json"
    "packages/backend/prisma/schema.prisma"
    "packages/backend/src/index.ts"
    "packages/frontend/app/layout.tsx"
)

ALL_FILES_PRESENT=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ Missing: $file"
        ALL_FILES_PRESENT=false
    fi
done

if $ALL_FILES_PRESENT; then
    print_pass "All critical files present"
else
    print_fail "Some critical files are missing"
fi

# Check Docker files
print_check "Docker configuration files"
DOCKER_FILES=(
    "docker/backend.Dockerfile"
    "docker/frontend.Dockerfile"
    "docker/nginx.conf"
)

ALL_DOCKER_PRESENT=true
for file in "${DOCKER_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ Missing: $file"
        ALL_DOCKER_PRESENT=false
    fi
done

if $ALL_DOCKER_PRESENT; then
    print_pass "All Docker files present"
else
    print_fail "Some Docker files are missing"
fi

# ============================================
# 3. CONFIGURATION VALIDATION
# ============================================

print_header "3. CONFIGURATION VALIDATION"

# Check .env.example
print_check ".env.example completeness"
REQUIRED_ENV_VARS=(
    "OPENAI_API_KEY"
    "OPENAI_ASSISTANT_ID"
    "JWT_ACCESS_SECRET"
    "JWT_REFRESH_SECRET"
    "ENCRYPTION_KEY"
    "DATABASE_URL"
    "REDIS_URL"
)

ALL_ENV_PRESENT=true
for var in "${REQUIRED_ENV_VARS[@]}"; do
    if grep -q "^$var=" .env.example; then
        echo "  ✓ $var"
    else
        echo "  ✗ Missing: $var"
        ALL_ENV_PRESENT=false
    fi
done

if $ALL_ENV_PRESENT; then
    print_pass "All required environment variables in .env.example"
else
    print_fail "Some required environment variables missing from .env.example"
fi

# Check docker-compose.yml validity
print_check "docker-compose.yml syntax"
if docker-compose config > /dev/null 2>&1; then
    print_pass "docker-compose.yml is valid"
else
    print_fail "docker-compose.yml has syntax errors"
fi

# ============================================
# 4. DEPENDENCIES CHECK
# ============================================

print_header "4. DEPENDENCIES CHECK"

# Check backend dependencies
print_check "Backend package.json"
if [ -f "packages/backend/package.json" ]; then
    BACKEND_DEPS=$(cat packages/backend/package.json | grep -c '"dependencies"')
    if [ $BACKEND_DEPS -gt 0 ]; then
        print_pass "Backend dependencies defined"
    else
        print_fail "Backend dependencies missing"
    fi
else
    print_fail "packages/backend/package.json not found"
fi

# Check frontend dependencies
print_check "Frontend package.json"
if [ -f "packages/frontend/package.json" ]; then
    FRONTEND_DEPS=$(cat packages/frontend/package.json | grep -c '"dependencies"')
    if [ $FRONTEND_DEPS -gt 0 ]; then
        print_pass "Frontend dependencies defined"
    else
        print_fail "Frontend dependencies missing"
    fi
else
    print_fail "packages/frontend/package.json not found"
fi

# Check shared package
print_check "Shared package configuration"
if [ -f "packages/shared/package.json" ]; then
    print_pass "Shared package.json exists"
else
    print_fail "packages/shared/package.json not found"
fi

# Check critical backend dependencies
print_check "Critical backend dependencies"
BACKEND_CRITICAL_DEPS=(
    "express"
    "prisma"
    "@prisma/client"
    "openai"
    "jsonwebtoken"
)

BACKEND_DEPS_OK=true
for dep in "${BACKEND_CRITICAL_DEPS[@]}"; do
    if grep -q "\"$dep\"" packages/backend/package.json; then
        echo "  ✓ $dep"
    else
        echo "  ✗ Missing: $dep"
        BACKEND_DEPS_OK=false
    fi
done

if $BACKEND_DEPS_OK; then
    print_pass "All critical backend dependencies present"
else
    print_fail "Some critical backend dependencies missing"
fi

# Check critical frontend dependencies
print_check "Critical frontend dependencies"
FRONTEND_CRITICAL_DEPS=(
    "next"
    "react"
    "axios"
)

FRONTEND_DEPS_OK=true
for dep in "${FRONTEND_CRITICAL_DEPS[@]}"; do
    if grep -q "\"$dep\"" packages/frontend/package.json; then
        echo "  ✓ $dep"
    else
        echo "  ✗ Missing: $dep"
        FRONTEND_DEPS_OK=false
    fi
done

if $FRONTEND_DEPS_OK; then
    print_pass "All critical frontend dependencies present"
else
    print_fail "Some critical frontend dependencies missing"
fi

# ============================================
# 5. DATABASE & MIGRATIONS
# ============================================

print_header "5. DATABASE & MIGRATIONS"

# Check Prisma schema
print_check "Prisma schema validity"
if [ -f "packages/backend/prisma/schema.prisma" ]; then
    # Check if schema has models
    MODEL_COUNT=$(grep -c "^model " packages/backend/prisma/schema.prisma || true)
    if [ $MODEL_COUNT -gt 0 ]; then
        print_pass "Prisma schema valid ($MODEL_COUNT models found)"
    else
        print_fail "Prisma schema has no models"
    fi
else
    print_fail "Prisma schema not found"
fi

# Check migrations
print_check "Prisma migrations"
if [ -d "packages/backend/prisma/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 packages/backend/prisma/migrations | wc -l)
    if [ $MIGRATION_COUNT -gt 0 ]; then
        print_pass "Prisma migrations present ($MIGRATION_COUNT migrations)"
    else
        print_warning "No Prisma migrations found (will be created on first run)"
    fi
else
    print_fail "Migrations directory not found"
fi

# Check migration lock
print_check "Prisma migration lock file"
if [ -f "packages/backend/prisma/migrations/migration_lock.toml" ]; then
    print_pass "Migration lock file present"
else
    print_warning "Migration lock file not found (will be created on first migration)"
fi

# ============================================
# 6. TYPESCRIPT & BUILD
# ============================================

print_header "6. TYPESCRIPT & BUILD"

# Check TypeScript config
print_check "TypeScript configuration (backend)"
if [ -f "packages/backend/tsconfig.json" ]; then
    print_pass "Backend tsconfig.json present"
else
    print_fail "Backend tsconfig.json missing"
fi

print_check "TypeScript configuration (frontend)"
if [ -f "packages/frontend/tsconfig.json" ]; then
    print_pass "Frontend tsconfig.json present"
else
    print_fail "Frontend tsconfig.json missing"
fi

# ============================================
# 7. DOCKER CONFIGURATION
# ============================================

print_header "7. DOCKER CONFIGURATION"

# Check docker-compose services
print_check "Docker Compose services"
REQUIRED_SERVICES=("postgres" "redis" "backend" "frontend")
SERVICES_OK=true

for service in "${REQUIRED_SERVICES[@]}"; do
    if grep -q "^  $service:" docker-compose.yml; then
        echo "  ✓ $service"
    else
        echo "  ✗ Missing service: $service"
        SERVICES_OK=false
    fi
done

if $SERVICES_OK; then
    print_pass "All required Docker services defined"
else
    print_fail "Some required Docker services missing"
fi

# Check ports configuration
print_check "Port configuration"
if grep -q "3002:3000" docker-compose.yml && grep -q "3003:3001" docker-compose.yml; then
    print_pass "Ports configured correctly (3002 frontend, 3003 backend)"
else
    print_warning "Non-standard port configuration detected"
fi

# ============================================
# 8. SECURITY CHECKS
# ============================================

print_header "8. SECURITY CHECKS"

# Check for .env in .gitignore
print_check ".env in .gitignore"
if [ -f ".gitignore" ]; then
    if grep -q "^\.env$" .gitignore; then
        print_pass ".env is in .gitignore"
    else
        print_fail ".env is NOT in .gitignore (security risk!)"
    fi
else
    print_fail ".gitignore not found"
fi

# Check for default secrets
print_check "Default secrets in .env.example"
if grep -q "changeme" .env.example || grep -q "your-" .env.example; then
    print_pass "Placeholder secrets found (good for example file)"
else
    print_warning "No placeholder secrets found in .env.example"
fi

# ============================================
# 9. DOCUMENTATION
# ============================================

print_header "9. DOCUMENTATION"

# Check documentation files
DOCS=(
    "README.md"
    "INSTALLATION_DOCKER.md"
    "DEPLOYMENT_STATUS.md"
)

DOCS_OK=true
for doc in "${DOCS[@]}"; do
    print_check "$doc"
    if [ -f "$doc" ]; then
        WORD_COUNT=$(wc -w < "$doc")
        if [ $WORD_COUNT -gt 100 ]; then
            print_pass "$doc exists and is complete ($WORD_COUNT words)"
        else
            print_warning "$doc exists but seems short ($WORD_COUNT words)"
        fi
    else
        print_fail "$doc not found"
        DOCS_OK=false
    fi
done

# ============================================
# 10. ROUTES & API CONSISTENCY
# ============================================

print_header "10. ROUTES & API CONSISTENCY"

# Check backend routes exist
print_check "Backend route files"
ROUTE_FILES=(
    "packages/backend/src/routes/auth.ts"
    "packages/backend/src/routes/site.ts"
    "packages/backend/src/routes/chat.ts"
    "packages/backend/src/routes/admin.ts"
)

ROUTES_OK=true
for route in "${ROUTE_FILES[@]}"; do
    if [ -f "$route" ]; then
        echo "  ✓ $route"
    else
        echo "  ✗ Missing: $route"
        ROUTES_OK=false
    fi
done

if $ROUTES_OK; then
    print_pass "All critical backend routes present"
else
    print_fail "Some backend route files missing"
fi

# Check API client
print_check "Frontend API client"
if [ -f "packages/frontend/lib/api-client.ts" ]; then
    # Count API methods
    METHOD_COUNT=$(grep -c "async " packages/frontend/lib/api-client.ts || true)
    if [ $METHOD_COUNT -gt 10 ]; then
        print_pass "API client exists with $METHOD_COUNT methods"
    else
        print_warning "API client seems incomplete ($METHOD_COUNT methods)"
    fi
else
    print_fail "Frontend API client not found"
fi

# ============================================
# FINAL SUMMARY
# ============================================

print_summary
