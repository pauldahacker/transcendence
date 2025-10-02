FROM alpine/openssl:3.5.3

WORKDIR /certs

CMD ["req", "-x509", "-nodes", "-days", "365", "-newkey", "rsa:2048", "-keyout", "key.pem", "-out", "cert.pem", "-subj", "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost"]