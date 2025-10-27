import { AuthUser, UserRole } from '../../../interfaces/auth.interfaces';

const authenticatedUser: AuthUser = {
  id: '',
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  role: UserRole.USER,
  iat: Date.now(),
  aud: '',
  iss: '',
  jti: '',
  isEmailVerified: true,
  size: 0,
  sizeLimit: -1,
  team: null,
};
export const AUTH_TOKEN_USER_MOCK = `xxx.${btoa(
  JSON.stringify(authenticatedUser)
)}.zzz`;

const guestUser: AuthUser = {
  id: '',
  name: 'Anonymes Axolotl',
  email: null,
  role: UserRole.GUEST,
  iat: Date.now(),
  aud: '',
  iss: '',
  jti: '',
  isEmailVerified: false,
  size: 0,
  sizeLimit: -1,
  team: null,
};
export const AUTH_TOKEN_GUEST_MOCK = `xxx.${btoa(
  JSON.stringify(authenticatedUser)
)}.zzz`;
