import { AvatarUser } from '../components/avatar-group/avatar/avatar.component';
import { EditorUserColor } from '../constants/editor.constants';
import { UserEntity } from '../services/api/entities/user.entity';

export interface EditorUserEntity extends UserEntity, AvatarUser {
  color: EditorUserColor;
}
