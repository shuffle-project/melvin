export interface EnabledFeatures {
  // General
  notifications: boolean;
  projectShare: boolean;
  projectCreate: boolean;
  projectEdit: boolean;
  download: boolean;
  live: boolean;
  installation: boolean;
  tutorial: boolean;
  guide: boolean;
  feedbackLink: boolean;

  // Editor
  timeNavigation: boolean;
  playPause: boolean;
  fileMenu: boolean;
  transcriptionsMenu: boolean;
  helpMenu: boolean;
  editTranscriptions: boolean;
  quickForwardRewind: boolean;
  showWaveform: boolean;
  toggleZoomedWaveform: boolean;
  captionHistory: boolean;
  captionFlag: boolean;
  captionPlayActions: boolean;
  captionTimeInput: boolean;
  captionProgressBar: boolean;
  settings: boolean;
  showTime: boolean;
  editorActions: boolean;
  showSpeaker: boolean;
  showShortcuts: boolean;

  // Video-Player
  playbackSpeed: boolean;
}

export interface Environment {
  production: boolean;
  env: 'test' | 'local' | 'docker';
  features: EnabledFeatures;
}
