import { UserRole } from '../user/user.interfaces';

export class JwtPayload {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  isEmailVerified: boolean;
  size: number;
  sizeLimit: number;
  team: string | null;
}

export interface DecodedToken extends JwtPayload {
  iat: number;
  aud: string;
  iss: string;
  jti: string;
}

export interface AuthUser {
  id: string;
  jwtId: string;
  role: UserRole;
}

export class MediaAccessJwtPayload {
  projectId: string;
}

export interface MediaAccessDecodedToken extends MediaAccessJwtPayload {
  iat: number;
  aud: string;
  iss: string;
  jti: string;
}

export interface MediaAccessUser {
  projectId: string;
}
