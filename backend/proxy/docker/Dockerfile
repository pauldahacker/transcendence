FROM nginx:stable-alpine

RUN apk add --no-cache openssl

# Generate self-signed SSL certificates
RUN mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/certs/key.pem -out /etc/nginx/certs/cert.pem -subj "/CN=localhost"

ADD default.conf.template /etc/nginx/templates/default.conf.template

CMD ["nginx", "-g", "daemon off;"]