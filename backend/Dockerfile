# Build stage

FROM node:18 as builder

# RUN apt-get update && apt-get install python -y
RUN apt-get update || : && apt-get install python -y

ENV NODE_ENV build

WORKDIR /app
COPY . .
RUN npm ci && npm run build && npm prune --production

# Final image

FROM node:18-alpine

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/assets/ ./assets/

CMD ["node", "dist/main.js"]