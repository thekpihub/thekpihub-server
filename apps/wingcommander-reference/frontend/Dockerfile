FROM node:20-alpine AS builder
WORKDIR /app

# Build context = repo root (npm workspaces monorepo — the lockfile only
# exists at the root, mirroring backend/Dockerfile's pattern).
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm install --workspaces --include=dev

COPY frontend ./frontend
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build --workspace=frontend

FROM nginx:alpine AS runner
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
