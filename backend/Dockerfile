# Build stage

FROM node:18 as builder

ENV NODE_ENV build

WORKDIR /app
COPY . .
RUN npm ci && npm run build && npm prune --production

# Final image

FROM node:18

RUN apt-get update || : && apt-get install python3 python3-pip git ffmpeg -y
# TODO https://pythonspeed.com/articles/externally-managed-environment-pep-668/
RUN pip3 install "git+https://github.com/openai/whisper.git" --break-system-packages

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/assets/ ./assets/

CMD ["node", "dist/main.js"]
