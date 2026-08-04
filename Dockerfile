# ==========================================
# Stage 1: Build Frontend Assets & Bundle Backend Server
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./

# Install all dependencies using ci for reproducible builds
RUN npm ci

# Copy source code and assets
COPY . .

# Build Vite SPA assets & bundle server.ts with esbuild to dist/server.cjs
RUN npm run build

# Generate SBOM
RUN npm sbom --sbom-format cyclonedx --omit dev > dist/sbom.json

# ==========================================
# Stage 2: Production Execution Runtime
# ==========================================
FROM node:22-alpine AS runner

# OCI-Labels
ARG GIT_REVISION=unknown
ARG BUILD_TIME=unknown
ARG VERSION=unknown
LABEL org.opencontainers.image.source="https://github.com/OuroborosCollective/SovAreAgentn1" \
      org.opencontainers.image.revision="${GIT_REVISION}" \
      org.opencontainers.image.created="${BUILD_TIME}" \
      org.opencontainers.image.version="${VERSION}"

WORKDIR /app

# Set Production Environment Flags
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Install production-only dependencies using ci
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled dist artifacts from builder stage (including sbom.json)
COPY --from=builder /app/dist ./dist

# Create necessary directories and set ownership for the node user
RUN mkdir -p /app/ssl /app/data /tmp && chown -R nplus1:nplus1 /app /tmp

# Switch to non-root user
RUN addgroup -g 10000 nplus1 && adduser -D -u 10000 -G nplus1 nplus1
RUN chown -R nplus1:nplus1 /app /tmp
USER nplus1

# Expose default HTTP port
EXPOSE 3000

# Health check probe using liveness check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/liveness || exit 1

# Start the bundled Express CommonJS server
CMD ["node", "dist/server.cjs"]
