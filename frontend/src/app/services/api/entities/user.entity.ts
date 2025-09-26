import { UserRole } from 'src/app/interfaces/auth.interfaces';

export interface UserEntity {
  id: string;
  role: string;
  name: string;
  email: string;
}

export interface UserEntityForAdmin {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  projectCount: number;
  mbOnDisc: number;
  accumulatedDuration: number;
}
