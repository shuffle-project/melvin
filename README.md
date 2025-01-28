# MELVIN

MELVIN is an open-source video platform designed to streamline accessible video production from recording to distribution.

More information can be found on the demo deployment: [https://melvin.shuffle-projekt.de](https://melvin.shuffle-projekt.de)

## Repositories

This repository contains the source code of the backend and frontend of MELVIN.

Instructions for the deployment can be found here: [https://github.com/shuffle-project/melvin-deployment](https://github.com/shuffle-project/melvin-deployment)

The Automatic Speech Recognition API service is maintained here: [https://github.com/shuffle-project/melvin-asr](https://github.com/shuffle-project/melvin-asr)

## Deploying melvin

## Getting started as developer

Start docker compose for databases and asr service:

```bash
# copy example conf (modify variables e.g. api-key)
cp asr.config.yml.example asr.config.yml

docker compose up
```

Start backend:

```bash
cd backend

# copy example conf (modify variables e.g.jwt-secret)
cp config.yml.example config.yml

# start dev server
npm run start:dev
```

Start frontend:

```bash
cd frontend

# start frontend
npm start
```
