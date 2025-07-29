import { Environment } from './environment.interface';

const env: any = (window as any)['env'];

export const environment: Environment = {
  production: true,
  env: 'docker',
};
