# Build stage

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build:docker

# Final image

FROM nginx:alpine
COPY --from=builder /app/dist/editor-frontend /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

CMD ["/bin/bash", "-c", \
"echo API_URL=[$API_URL], && \
sed -i s#BACKEND_BASE_URL#$BACKEND_BASE_URL#g /usr/share/nginx/html/main.*.js && \
sed -i s#FRONTEND_BASE_URL#$FRONTEND_BASE_URL#g /usr/share/nginx/html/main.*.js && \
nginx -g 'daemon off;'"]