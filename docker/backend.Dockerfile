FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
RUN pnpm install --frozen-lockfile

# Build backend
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY packages/backend ./packages/backend
COPY pnpm-workspace.yaml ./

WORKDIR /app/packages/backend

# Generate Prisma Client
RUN pnpm prisma:generate

# Build TypeScript
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/backend/package.json ./

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs

EXPOSE 3001

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
