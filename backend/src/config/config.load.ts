import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { Config } from './config.interface';

export const configuration = (): Config => {
  const filename =
    process.env.JEST_WORKER_ID !== undefined ? 'config.test.yml' : 'config.yml';

  const content = yaml.load(
    readFileSync(join(__dirname, '../../', filename), 'utf8'),
  ) as Record<string, any>;

  const config = plainToInstance(Config, content, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(config, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return config;
};
