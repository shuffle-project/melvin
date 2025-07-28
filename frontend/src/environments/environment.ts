// This file can be replaced during build by using the `fileReplacements` array.

import { Environment } from './environment.interface';

export const environment: Environment = {
  production: false,
  env: 'local',
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
    feedbackLink: true,

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

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
