# ==========================================
# Stage 1: Build Frontend Assets & Bundle Backend Server
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies required for compilation)
RUN npm install

# Copy source code and assets
COPY . .

# Build Vite SPA assets & bundle server.ts with esbuild to dist/server.cjs
RUN npm run build

# ==========================================
# Stage 2: Production Execution Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set Production Environment Flags
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Install production-only dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled dist artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Create ssl and data directory for runtime storage
RUN mkdir -p ssl data

# Expose default HTTP port
EXPOSE 3000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/bughunt/diagnose || exit 1

# Start the bundled Express CommonJS server
CMD ["node", "dist/server.cjs"]
