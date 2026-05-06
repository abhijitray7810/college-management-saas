# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install only production deps first (better layer caching)
COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ─── Stage 2: Builder (with devDeps for any build steps) ─────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci && npm cache clean --force
COPY server/ .

# ─── Stage 3: Runner (minimal image) ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs appuser

# Copy only production node_modules + source
COPY --from=deps    --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/src          ./src
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

USER appuser

# Drizzle config is read-only at runtime; migrations run as an init container
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
