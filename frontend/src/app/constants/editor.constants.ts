import { UserRole } from '../interfaces/auth.interfaces';
import { EditorUserEntity } from '../interfaces/editor-user.interface';

export enum EditorUserColor {
  PRIMARY = 'primary',
  UNKNOWN = 'unknown',
  ORANGE = 'orange',
  RED = 'red',
  PINK = 'pink',
  PURPLE = 'purple',
  BLUE = 'blue',
  GREEN = 'green',
  TURQUOISE = 'turquoise',
}
// test
export const AVAILABLE_EDITOR_USER_COLORS = Object.values(
  EditorUserColor
).slice(2, Object.values(EditorUserColor).length);

export const EDITOR_USER_LOADING: EditorUserEntity = {
  id: '',
  clientId: '',
  name: 'Lädt...',
  email: '',
  role: '',
  color: EditorUserColor.UNKNOWN,
};

export const EDITOR_USER_UNKNOWN: EditorUserEntity = {
  name: 'Unbekannt',
  role: UserRole.USER,
  clientId: '',
  id: '',
  email: '',
  color: EditorUserColor.UNKNOWN,
};
