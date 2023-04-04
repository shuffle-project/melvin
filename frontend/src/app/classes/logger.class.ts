type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export class CustomLogger {
  private enabled: boolean = true;

  constructor(private context: string) {}

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }

  error(message?: any, ...values: any[]) {
    this.log('error', message, ...values);
  }

  warn(message?: any, ...values: any[]) {
    this.log('warn', message, ...values);
  }

  info(message?: any, ...values: any[]) {
    this.log('info', message, ...values);
  }

  debug(message?: any, ...values: any[]) {
    this.log('debug', message, ...values);
  }

  verbose(message?: any, ...values: any[]) {
    this.log('verbose', message, ...values);
  }

  private log(level: LogLevel, message?: any, ...values: any[]) {
    if (!this.enabled) {
      return;
    }

    const text = `[${this.context}] ${level}: ${message}`;
    switch (level) {
      case 'error':
        console.error(text, ...values);
        break;
      case 'warn':
        console.warn(text, ...values);
        break;
      case 'info':
        console.log(text, ...values);
        break;
      case 'debug':
        console.log(text, ...values);
        break;
      case 'verbose':
        console.log(text, ...values);
        break;
    }
  }
}
