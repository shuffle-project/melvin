import { randomInt } from 'crypto';

const CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');

const PASSWORD_CHARACTERS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%&@^`~.,!?'.split(
    '',
  );

export const generateSecureToken = (length = 64): string => {
  const token = new Array(length)
    .fill(0)
    .map(() => CHARACTERS[randomInt(0, CHARACTERS.length)])
    .join('');
  return token;
};

export const generateSecurePassword = (length = 32): string => {
  const token = new Array(length)
    .fill(0)
    .map(() => PASSWORD_CHARACTERS[randomInt(0, PASSWORD_CHARACTERS.length)])
    .join('');
  return token;
};
