import { UserRole } from 'src/app/interfaces/auth.interfaces';

export interface UserEntity {
  id: string;
  role: string;
  name: string;
  email: string;
}

export interface UserEntityForAdmin {
  projects: {
    id: string;
    mbOnDisc: number;
  }[];
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mbOnDisc: number;
}
