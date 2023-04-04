import { readFile } from 'fs/promises';
import { join } from 'path';

export const getVersion = async (): Promise<string> => {
  const path = join(__dirname, '../../', 'package.json');
  const content = await readFile(path, 'utf8');
  const { version } = JSON.parse(content);
  return version;
};
