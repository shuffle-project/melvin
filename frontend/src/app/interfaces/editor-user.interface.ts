import { EditorUserColor } from '../constants/editor.constants';
import { UserEntity } from '../services/api/entities/user.entity';

export interface EditorUser extends UserEntity {
  color: EditorUserColor;
}
