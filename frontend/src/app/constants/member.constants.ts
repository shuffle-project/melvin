import { UserEntity } from '../services/api/entities/user.entity';

export enum MemberEntryType {
  USER = 'user',
  VALID_EMAIL = 'valid email',
  INVALID_EMAIL = 'invalid email',
}

export interface MemberEntry {
  type: MemberEntryType;
  user?: UserEntity;
  unknownEmail?: string;
}
