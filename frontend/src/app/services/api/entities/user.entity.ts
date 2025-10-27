import { UserRole } from 'src/app/interfaces/auth.interfaces';
import { TeamEntity } from './team.entity';

export interface UserEntity {
  id: string;
  role: string;
  name: string;
  email: string;
}

export interface UserEntityForAdmin {
  id: string;
  email: string;
  isEmailVerified: boolean;
  role: UserRole;
  name: string;
  projectCount: number;
  sizeInByte: number;
  sizeLimit: number;
  team: TeamEntity | null;
  accumulatedDuration: number;
}
