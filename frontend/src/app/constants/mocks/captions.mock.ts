import {
  TranscriptionEntity,
  TranscriptionStatus,
} from '../../services/api/entities/transcription.entity';

export const TRANSCIRPTIONS_ENITITY_MOCK: TranscriptionEntity[] = [
  {
    id: '6200e99cc8487aecd998dee8',
    createdAt: '2022-02-10T17:01:42.427Z',
    createdBy: { id: '6200e990a252dd82c266326e', name: 'Jane Doe' },
    updatedAt: '2022-02-10T17:01:42.427Z',
    project: '6200e98c9f6b0de828dbe34a',
    title: 'German',
    language: 'de-DE',
    status: TranscriptionStatus.OK,
    speakers: [
      {
        id: '6200e99681b1aa5840db08a5',
        updatedAt: '2022-02-10T17:01:42.427Z',
        name: 'Jane Doe',
      },
    ],
  },
];
