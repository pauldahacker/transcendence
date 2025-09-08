# Stage 1: Build frontend with Node
FROM node:18-alpine AS builder

WORKDIR /app/frontend

# Copy package.json first (better cache)
COPY frontend/package*.json frontend/tsconfig.json ./
RUN npm install

# Copy sources
COPY frontend/ ./

# Run full build (TypeScript + Tailwind + bundler)
RUN npm run build

# Stage 2: Minimal Nginx serving compiled assets
FROM alpine:3.21

RUN apk add --no-cache nginx

# Copy nginx config
COPY requirements/nginx/nginx.conf /etc/nginx/nginx.conf

# Copy only compiled JS + static assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

WORKDIR /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
