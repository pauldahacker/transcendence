# Stage 1: install frontend dependencies once so later stages can reuse them
FROM node:18-alpine AS base

WORKDIR /app/frontend

# Copy package.json first (better cache)
COPY frontend/package*.json frontend/tsconfig.json ./
RUN npm install

# Stage 2: development server (exposed through docker compose with target=dev)
FROM base AS dev

# Copy the whole project. When running with a bind mount the host files will
# overwrite the copy, but having the sources in the image keeps the dev image
# usable without a mount.
COPY frontend/ ./

ENV HOST=0.0.0.0 \
    PORT=5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]

# Stage 3: Build frontend with Node for production
FROM base AS builder

# Copy sources
COPY frontend/ ./

# Run full build (TypeScript + Tailwind + bundler)
RUN npm run build

# Stage 4: Minimal Nginx serving compiled assets
FROM alpine:3.21

RUN apk add --no-cache nginx

# Copy nginx config
COPY requirements/nginx/nginx.conf /etc/nginx/nginx.conf

# Copy only compiled JS + static assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

WORKDIR /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
