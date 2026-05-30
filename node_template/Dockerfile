# ─────────────────────────────────────────────
# Stage 1: BUILD (compile TypeScript → JS)
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json package-lock.json tsconfig.json ./

# Install ALL dependencies (devDeps needed for tsc)
RUN npm ci

# Copy source code
COPY src ./src

# Compile TypeScript to JavaScript
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: PRODUCTION runtime (lean image)
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S hrms && adduser -S hrms -G hrms

WORKDIR /app

# Copy only production dependency manifests
COPY package.json package-lock.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JS from builder stage
COPY --from=builder /app/dist ./dist

# Create logs directory with proper ownership
RUN mkdir -p logs && chown -R hrms:hrms /app

USER hrms

# The server listens on PORT from .env (default 4000)
EXPOSE 4000

# Healthcheck – hits a simple endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:4000/api/health 2>/dev/null || exit 1

CMD ["node", "dist/server.js"]
