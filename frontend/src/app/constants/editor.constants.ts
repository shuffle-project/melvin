import { UserRole } from '../interfaces/auth.interfaces';
import { EditorUser } from '../interfaces/editor-user.interface';

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

export const EDITOR_USER_LOADING: EditorUser = {
  id: '',
  name: 'Lädt...',
  email: '',
  role: '',
  color: EditorUserColor.UNKNOWN,
};

export const EDITOR_USER_UNKNOWN: EditorUser = {
  name: 'Unbekannt',
  role: UserRole.USER,
  id: '',
  email: '',
  color: EditorUserColor.UNKNOWN,
};
