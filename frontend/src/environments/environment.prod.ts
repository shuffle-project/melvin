import { Environment } from './environment.interface';

const env: any = (window as any)['env'];

export const environment: Environment = {
  production: true,
  frontendBaseUrl: env.frontendBaseUrl || 'http://localhost:4200',
  baseRestApi: env.backendBaseUrl || 'http://localhost:3000',
  features: {
    // General
    notifications: true,
    projectShare: true,
    projectCreate: true,
    projectEdit: true,
    download: true,

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