# Build stage

FROM node:18-alpine AS builder

RUN apk add --update --no-cache python3 build-base gcc && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app
COPY . .
RUN npm ci && npm run build:docker

# Final image

FROM nginx:alpine
RUN apk add --no-cache bash
COPY --from=builder /app/dist/editor-frontend/browser /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx.sh /nginx.sh
EXPOSE 80

ENTRYPOINT ["bash", "./nginx.sh"]