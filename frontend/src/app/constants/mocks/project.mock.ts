import {
  ProjectEntity,
  ProjectStatus,
} from '../../services/api/entities/project.entity';

export const PROJECT_ENTITY_MOCK: ProjectEntity[] = [
  {
    id: '6200e98c9f6b0de828dbe34a',
    createdAt: '2022-02-10T16:06:41.987Z',
    updatedAt: '2022-02-10T16:06:41.987Z',
    createdBy: {
      id: '6200e990a252dd82c266326e',
      email: 'example@example.de',
      name: 'example',
      role: 'user',
    },
    title: 'Dangerous superficial knowledge',
    users: [],
    // users: ['6200e990a252dd82c266326e'],
    transcriptions: [],
    // transcriptions: ['6200e99cc8487aecd998dee8'],
    status: ProjectStatus.DRAFT,
    duration: 2700000,
    start: 0,
    end: 2700000,
    language: 'de-DE',
    exports: ['6200e98275f8fc58715da44a'],
  },
];
