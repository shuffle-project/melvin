import { Environment } from './environment.interface';

const env: any = (window as any)['env'];

export const environment: Environment = {
  production: true,
  frontendBaseUrl: 'FRONTEND_BASE_URL',
  baseRestApi: 'BACKEND_BASE_URL',
  hocuspocusUrl: 'HOCUSPOCUS_URL',
  features: {
    // General
    notifications: true,
    projectShare: true,
    projectCreate: true,
    projectEdit: true,
    download: true,
    live: false,

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

    // Video-Player
    playbackSpeed: true,
  },
};
