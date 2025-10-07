FROM node:24.9.0-alpine3.21@sha256:843a738e7405b4fb42b2fc37d6c99cd2063af9f48852968a09851129a96b0ebf

# Install dependencies
RUN apk add --no-cache curl openssl dumb-init

# Create a non-root user to run the application
RUN adduser -D app
USER app

# Build the application
WORKDIR /app
COPY --chown=app:app package* ./
RUN npm install

# Copy application files
COPY --chown=app:app . /app

# Generate self-signed SSL certificates
RUN mkdir -p /app/certs && \
	openssl req -x509 -newkey rsa:4096 -keyout /app/certs/key.pem -out /app/certs/cert.pem -days 365 -nodes -subj "/C=ES/L=Barcelona/O=42/CN=localhost"

CMD ["dumb-init", "npm", "run", "dev"]