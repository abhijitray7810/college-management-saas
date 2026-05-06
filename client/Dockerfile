# ─── Stage 1: Build React/Vite app ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY client/package*.json ./
RUN npm ci && npm cache clean --force

COPY client/ .
# Build with production env (VITE_ vars injected at build time)
RUN npm run build

# ─── Stage 2: Serve with Nginx ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing + security headers
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/app.conf

# Non-root nginx
RUN chown -R nginx:nginx /usr/share/nginx/html \
 && chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
