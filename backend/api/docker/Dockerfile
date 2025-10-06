FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache curl openssl

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

CMD ["npm", "start"]