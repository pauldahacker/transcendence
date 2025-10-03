FROM alpine/openssl:3.5.3

WORKDIR /certs

CMD ["req", "-x509", "-nodes", "-days", "365", "-newkey", "rsa:2048", "-keyout", "key.pem", "-out", "cert.pem", "-subj", "/C=ES/L=Barcelona/O=42/CN=localhost"]