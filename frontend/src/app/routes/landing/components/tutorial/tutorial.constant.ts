export interface TutorialStep {
  text: {
    en: string;
    de: string;
  };
  info?: {
    en: string;
    de: string;
  };
  img?: string;
}

export const RECORD_TUTORIAL: TutorialStep[] = [
  {
    text: {
      en: 'Click on <strong>“New Project”</strong> above your project list and select <strong>“Recorder”</strong> from the drop-down menu.',
      de: '',
    },
  },
  {
    text: {
      en: 'You are now on the recorder page. Add your desired input sources here (e.g., microphone, camera, or screen). At least one <strong>audio source</strong> and one <strong>video or screen source</strong> are required to start recording.',
      de: '',
    },
    info: {
      en: 'The browser will request permission the first time. Allow access when prompted. If no prompt appears, search online for: “[Your browser, e.g., Firefox] [microphone / camera / screen] allow permissions”',
      de: '',
    },
  },
];
