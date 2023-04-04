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

export interface EditorActiveUser {
  id: string;
  color: EditorUserColor;
}

export const AVAILABLE_EDITOR_USER_COLORS = Object.values(
  EditorUserColor,
).slice(2, Object.values(EditorUserColor).length);
