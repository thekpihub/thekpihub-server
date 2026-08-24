# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests (build context = repo root)
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

# Install all workspace deps (includes devDeps for tsc)
RUN npm install --workspaces --include=dev

# Copy backend source
COPY backend/tsconfig.json ./backend/
COPY backend/src ./backend/src

# Compile TypeScript
RUN npm run build --workspace=backend

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

# Production deps only
RUN npm install --workspaces --omit=dev

# Copy compiled output
COPY --from=builder /app/backend/dist ./backend/dist

# Persistent data directory (mount Railway volume here: /app/backend/data)
RUN mkdir -p ./backend/data/vectors

EXPOSE 4000
WORKDIR /app/backend
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
