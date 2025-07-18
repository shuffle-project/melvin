import { Environment } from './environment.interface';

const env: any = (window as any)['env'];

export const environment: Environment = {
  production: true,
  frontendBaseUrl: 'FRONTEND_BASE_URL',
  baseRestApi: 'BACKEND_BASE_URL',

  melvinImprintURL: 'MELVIN_IMPRINT_URL',
  melvinPrivacyURL: 'MELVIN_PRIVACY_URL',

  features: {
    // General
    notifications: true,
    projectShare: true,
    projectCreate: true,
    projectEdit: true,
    download: true,
    live: false,
    installation: true,
    tutorial: true,
    guide: true,
    feedbackLink: false,

    // Editor
    timeNavigation: true,
    playPause: true,
    fileMenu: true,
    transcriptionsMenu: true,
    helpMenu: true,
    editTranscriptions: true,
    quickForwardRewind: true,
    showWaveform: true,
    toggleZoomedWaveform: true,
    captionHistory: true,
    captionFlag: true,
    captionPlayActions: true,
    captionTimeInput: true,
    captionProgressBar: true,
    settings: true,
    showTime: true,
    editorActions: true,
    showSpeaker: true,
    showShortcuts: true,

    // Video-Player
    playbackSpeed: true,
  },
};
