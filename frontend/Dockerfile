# Build stage

FROM node:18-alpine AS builder

RUN apk add --update --no-cache python3 build-base gcc && ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app
COPY . .
# TODO remove force after updating angular schematics to v18
RUN npm ci --force && npm run build:docker

# Final image

FROM nginx:alpine
COPY --from=builder /app/dist/editor-frontend /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx.sh /nginx.sh
EXPOSE 80

CMD ["sh", "nginx.sh"]