FROM node:24.9.0-alpine3.21@sha256:843a738e7405b4fb42b2fc37d6c99cd2063af9f48852968a09851129a96b0ebf

# Install dependencies
RUN apk add --no-cache dumb-init curl openssl

# Create a non-root user to run the application
RUN adduser -D app
USER app

# Build the application
WORKDIR /app
COPY --chown=app:app package* ./
RUN npm install

# Copy application files
COPY --chown=app:app . /app

# Create necessary directories
RUN mkdir -p /app/db

CMD ["dumb-init", "node", "server.js"]