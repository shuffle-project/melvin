# MELVIN

MELVIN is an open-source video platform designed to streamline accessible video production from recording to distribution.

More information can be found on the demo deployment: [https://melvin.shuffle-projekt.de](https://melvin.shuffle-projekt.de)

The Automatic Speech Recognition API service is maintained here: [https://github.com/shuffle-project/melvin-asr](https://github.com/shuffle-project/melvin-asr)

## Deploying melvin

Melvin can easily be deployed with a docker.

1. Copy all files of the [examples directory](examples/deployment) into a local directory.
2. Adjust the configuration in the .yml config files (e.g. secrets or domains) and the .env file.
3. Start the Melvin stack with: `docker compose up`.
4. Open [localhost:8080](localhost:8080) in your browser.

### System requirements

Minimum system requirements to run Melvin and ASR processing.

- Storage: 1 GB/hour per video
- RAM: 16GB
- GPU: We recommend a GPU with 16GB VRAM. CPU can be used for ASR, but is significantly slower. See our [ASR service](https://github.com/shuffle-project/melvin-asr) for more information.
- CPU: Melvin uses ffmpeg to convert videos. Having multiple CPU cores available increases processing speed, particularly for long videos with high resolution.


## Installation

### Getting started as developer

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

### Configuration

| Variable Name                       | Default                | Required | Description                                                                                                  |
|-------------------------------------|------------------------|----------|--------------------------------------------------------------------------------------------------------------|
| MELVIN_FRONTEND_BASE_URL            | http://localhost:8080  | true     | Frontend URL                                                                                                 |
| MELVIN_BACKEND_BASE_URL             | https://localhost:3000 | true     | Backend URL                                                                                                  |
| MELVIN_DISABLE_LANDING_PAGE         | false                  | false    | Show login form instead of the landing page. This will also disable the Tutorial and Best Practice subpages  |
| MELVIN_DISABLE_TUTORIAL_VIDEOS      | true                   | false    | Videos are server-hosted and might not be  available at Melvin startup, therefore disabled by default        |
| MELVIN_DISABLE_INSTALLATION_PAGE    | true                   | false    | Disable Installation page                                                                                    |
| MELVIN_IMPRINT_URL=                 |                        | false    | Default Imprint URL, will be used if no language specific one is set                                         |
| MELVIN_PRIVACY_URL=                 |                        | false    | Default Privacy URL, will be used if no language specific one is set                                         |
| MELVIN_SIGN_LANGUAGE_URL=           |                        | false    | Default Sign Language URL, will be used if no language specific one is set                                   |
| MELVIN_EASY_LANGUAGE_URL=           |                        | false    | Default Easy Language URL, will be used if no language specific one is set                                   |
| MELVIN_ACCESSIBILITY_STATEMENT_URL= |                        | false    | Default Accessibility Statement URL, will be used if no language specific one is set                         |
| MELVIN_DE_IMPRINT_URL=              |                        | false    | German Imprint URL*                                                                                          |
| MELVIN_EN_IMPRINT_URL=              |                        | false    | English Imprint URL*                                                                                         |
| MELVIN_CONTACT_EMAIL=               |                        | false    | Your contact email will be visible in the footer                                                             |

\* The German and English Imprint URLs are provided here as examples. The links for the privacy policy, sign language, easy language, and accessibility statement can also be specified in a language-specific way using \_EN\_ and \_DE\_ in the variable name.
