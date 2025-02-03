import { UserRole } from '../interfaces/auth.interfaces';
import { EditorUserEntity } from '../interfaces/editor-user.interface';

export const EDITOR_USER_LOADING: EditorUserEntity = {
  id: '',
  clientId: '',
  name: 'Lädt...',
  email: '',
  role: '',
  color: 0, //color 0 -> grey (unknown)
};

export const EDITOR_USER_UNKNOWN: EditorUserEntity = {
  name: 'Unbekannt',
  role: UserRole.USER,
  clientId: '',
  id: '',
  email: '',
  color: 0, //color 0 -> grey (unknown)
};
