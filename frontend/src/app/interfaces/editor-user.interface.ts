import { AvatarUser } from '../components/avatar-group/avatar/avatar.component';
import { UserEntity } from '../services/api/entities/user.entity';

export type EditorUserColor = 0 | 1 | 2 | 3 | 4 | 5;

export interface EditorUserEntity extends UserEntity, AvatarUser {
  color: EditorUserColor;
}
