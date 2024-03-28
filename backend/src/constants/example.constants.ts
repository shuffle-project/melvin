const ids = {
  export: '6200e98275f8fc58715da44a',
  project: '6200e98c9f6b0de828dbe34a',
  projectInviteToken: '622f321604818c646950a560',
  user: '6200e990a252dd82c266326e',
  speaker: '6200e99681b1aa5840db08a5',
  transcription: '6200e99cc8487aecd998dee8',
  caption: '6200e9a04b4bbd70eed77ed0',
  captionHistory: '6200e9a58611285852f49e14',
  activity: '627262598bfefa43dd1c9d82',
  notification: '627262598bfefa43dd1c9d8b',
};

export const EXAMPLE_EXPORT = {
  _id: ids.export,
  extension: 'zip',
};

export const EXAMPLE_PROJECT = {
  _id: ids.project,
  title: 'Dangerous superficial knowledge',
  status: 'draft',
  duration: 408000,
  start: 0,
  end: 408000,
  language: 'de-DE',
  createdBy: ids.user,
  users: [ids.user],
  transcriptions: [ids.transcription],
  inviteToken:
    'yelFMz2hoS_Bh9ZCa9NTwvlqN1okIu3uTiEkxx5xoNTFivfsrfoJl3DxpxJU9KhaqOd8EQ9ucpTpsK3-kUbvjw',
  viewerToken:
    'xelFMz2hoS_Bh9ZCa9NTwvlqN1okIu3uTiEkxx5xoNTFivfsrfoJl3DxpxJU9KhaqOd8EQ9ucpTpsK3-kUbvjw',
  audios: [
    {
      category: 'main',
      extension: 'mp3',
      status: 'finished',
      originalFileName: '',
      title: 'mainaudio',
    },
  ],
  videos: [
    {
      category: 'main',
      extension: 'mp4',
      status: 'finished',
      originalFileName: '',
      title: 'mainvideo',
    },
  ],
};

export const EXAMPLE_PROJECT_INVITE = {
  _id: ids.projectInviteToken,
  users: [ids.user],
};

export const EXAMPLE_USER = {
  _id: ids.user,
  projects: [EXAMPLE_PROJECT._id],
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  hashedPassword:
    '$2b$10$LzunOlKd./LYJOsGZBO/u.4m8R3ob14ypuwnkLFhHP.CCQjXDqt1a',
  role: 'user',
};

export const EXAMPLE_SPEAKER = {
  _id: ids.speaker,
  name: 'Jane Doe',
};

export const EXAMPLE_TRANSCRIPTION = {
  _id: ids.transcription,
  title: 'German',
  language: 'de-DE',
  speakers: [{ ...EXAMPLE_SPEAKER }],
  project: EXAMPLE_PROJECT._id,
};

export const EXAMPLE_CAPTION = {
  _id: ids.caption,
  text: 'The uncle of my mothers friend knows someone who thinks that.',
  initialText:
    'The aunt of my fathers colleague knows someone who thinks that.',
  start: 28000,
  end: 35000,
  transcription: ids.transcription,
  project: ids.project,
};

export const EXAMPLE_CAPTION_HISTORY = {
  _id: ids.captionHistory,
  text: 'The aunt of my fathers colleague knows someone who thinks that.',
};

export const EXAMPLE_ACTIVITY = {
  _id: ids.activity,
  action: 'project-status-updated',
  details: {
    statusBefore: 'draft',
    statusAfter: 'finished',
  },
};

export const EXAMPLE_NOTIFICATION = {
  _id: ids.notification,
  read: false,
};

export const MEDIA_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9qZWN0SWQiOiI2MjAwZTk4YzlmNmIwZGU4MjhkYmUzNGEiLCJpYXQiOjE2NTU4OTQyMjAsImV4cCI6MTY1NTkyMzAyMCwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdDo0MjAwIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwianRpIjoiODBjZDYzMjUtNDlmMC00Mzk2LWE4ZTYtYzdkY2JlYjA1ZDk2In0.9nVx3GwnYtTyJv0HXnSONpMgI3Yd-7vKgCeiNTTsy_Q';
