FROM node:24.9.0-alpine3.21@sha256:843a738e7405b4fb42b2fc37d6c99cd2063af9f48852968a09851129a96b0ebf

# Install dependencies
RUN apk add --no-cache curl dumb-init && \
    apk add --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing mkcert

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
RUN mkdir -p /app/certs /app/db && cd /app/certs && \
	mkcert -install && \
	mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1

CMD ["dumb-init", "npm", "run", "dev"]