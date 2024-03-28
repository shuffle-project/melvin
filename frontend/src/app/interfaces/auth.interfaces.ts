export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  iat: number;
  aud: string;
  iss: string;
  jti: string;
}
