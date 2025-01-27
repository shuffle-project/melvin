export type EditorUserColor = 0 | 1 | 2 | 3 | 4 | 5;

export interface EditorActiveUser {
  userId: string;
  clientId: string;
  active: boolean;
  color: EditorUserColor;
}

// exclude 0, as it stands for grey (unknown)
export const AVAILABLE_EDITOR_USER_COLORS: EditorUserColor[] = [1, 2, 3, 4, 5];
