export interface Environment {
  production: boolean;
  env: 'test' | 'local' | 'docker';
}
