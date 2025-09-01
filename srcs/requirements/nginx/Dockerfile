# Stage 1: Just serve compiled assets
FROM alpine:3.21
RUN apk add --no-cache nginx

COPY requirements/nginx/nginx.conf /etc/nginx/nginx.conf

# Copy already-compiled frontend
COPY dist /usr/share/nginx/html/
COPY frontend/index.html /usr/share/nginx/html/
COPY frontend/styles.css /usr/share/nginx/html/

WORKDIR /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
