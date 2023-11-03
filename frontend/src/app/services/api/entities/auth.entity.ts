export interface InviteEntity {
  projectId: string;
  projectTitle: string;
  userName: string;
}

export interface GuestLoginEntity {
  token: string;
  projectId: string;
}
