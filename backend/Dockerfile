# Build stage

FROM node:18 as builder

# RUN apt-get update && apt-get install python -y
RUN apt-get update || : && apt-get install python3 -y

ENV NODE_ENV build

WORKDIR /app
COPY . .
RUN npm ci && npm run build && npm prune --production

# Final image

FROM node:18

ENV NODE_ENV production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/assets/ ./assets/
COPY --from=builder /app/config.yml ./config.yml


RUN apt-get update || : && apt-get install python3 python3-pip -y
RUN apt-get update && apt-get install git -y
# TODO https://pythonspeed.com/articles/externally-managed-environment-pep-668/
RUN pip3 install "git+https://github.com/openai/whisper.git" --break-system-packages
RUN apt-get install -y ffmpeg


CMD ["node", "dist/main.js"]
