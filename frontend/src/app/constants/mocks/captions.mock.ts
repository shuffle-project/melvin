import {
  CaptionEntity,
  CaptionStatusEnum,
} from '../../services/api/entities/caption.entity';
import {
  TranscriptionEntity,
  TranscriptionStatus,
} from '../../services/api/entities/transcription.entity';

export const CAPTIONS_ENTITY_MOCK: CaptionEntity[] = [
  {
    id: '6200e9a04b4bbd70eed77ed0',
    createdAt: '2022-02-10T17:03:17.890Z',
    updatedAt: '2022-02-10T17:03:17.890Z',
    project: '6200e98c9f6b0de828dbe34a',
    transcription: '6200e99cc8487aecd998dee8',
    updatedBy: '6200e990a252dd82c266326e',
    wasManuallyEdited: true,
    initialText:
      'The aunt of my fathers colleague knows someone who thinks that.',
    text: 'The uncle of my mothers friend knows someone who thinks that.',
    start: 28000,
    end: 35000,
    speakerId: '6200e99681b1aa5840db08a5',
    lockedBy: '6200e990a252dd82c266326e',
    status: CaptionStatusEnum.FLAGGED,
    history: [
      {
        id: '6200e9a58611285852f49e14',
        createdAt: '2022-02-10T17:03:17.890Z',
        createdBy: '6200e990a252dd82c266326e',
        text: 'The aunt of my fathers colleague knows someone who thinks that.',
      },
    ],
  },
];

export const TRANSCIRPTIONS_ENITITY_MOCK: TranscriptionEntity[] = [
  {
    id: '6200e99cc8487aecd998dee8',
    createdAt: '2022-02-10T17:01:42.427Z',
    createdBy: { id: '6200e990a252dd82c266326e', name: 'Jane Doe' },
    updatedAt: '2022-02-10T17:01:42.427Z',
    project: '6200e98c9f6b0de828dbe34a',
    title: 'German',
    language: 'de-DE',
    transcriptionStatus: TranscriptionStatus.OK,
    speakers: [
      {
        id: '6200e99681b1aa5840db08a5',
        updatedAt: '2022-02-10T17:01:42.427Z',
        name: 'Jane Doe',
      },
    ],
  },
];
