import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import chalk from 'chalk';
import dayjs from 'dayjs';
import { isNil } from 'lodash';
import { Environment } from '../../config/config.interface';
import { serialize } from './../../utils/serialize';

type LogLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends ConsoleLogger {
  private environment: Environment;

  constructor(private configService: ConfigService) {
    super();

    this.environment = this.configService.get<Environment>('environment');
  }

  _print(level: LogLevel, message: string, details?: any) {
    if (this.environment === Environment.TEST) {
      return;
    }

    const tempLogDetails: any[] = [];

    // Transform relevant log details to temporary array
    if (Array.isArray(details)) {
      if (this.context === 'Application') {
        const [first, ...rest] = details;
        message = `${first}: ${message}`;
        tempLogDetails.push(...rest);
      } else {
        message = `${this.context}: ${message}`;
        tempLogDetails.push(...details);
      }
    } else {
      message = `${this.context}: ${message}`;
      tempLogDetails.push(details);
    }

    // Remove empty values and serialize data
    const serializedLogDetails = tempLogDetails
      .filter((o) => !isNil(o))
      .map((o) => serialize(o));

    // Set relevant log details to undefined, object or array
    let logDetails: any;
    switch (serializedLogDetails.length) {
      case 0:
        break;
      case 1:
        logDetails = serializedLogDetails[0];
        break;
      default:
        logDetails = serializedLogDetails;
    }

    // Prettified console logger
    if (this.environment === Environment.LOCAL) {
      const appendix = logDetails
        ? `\n${chalk.gray(JSON.stringify(logDetails, null, 2))}`
        : '';

      const colorize =
        { error: chalk.red, warn: chalk.yellow, info: chalk.blueBright }[
          level
        ] ?? chalk.gray;

      console.log(
        `${dayjs().format('YYYY-MM-DD HH:mm.ss.SSS')} ${colorize(
          level,
        )} ${message}${appendix}`,
      );
      return;
    }

    // JSON logger
    console.log(
      JSON.stringify({
        timestamp: dayjs().toISOString(),
        level,
        message,
        ...(logDetails ? { details: logDetails } : {}),
      }),
    );
  }

  log(message: string, ...details: any) {
    this.info(message, ...details);
  }

  info(message: string, ...details: any) {
    this._print('info', message, details);
  }

  error(message: string, ...details: any) {
    this._print('error', message, details);
  }

  warn(message: string, ...details: any) {
    this._print('warn', message, details);
  }

  debug(message: string, ...details: any) {
    this._print('debug', message, details);
  }

  verbose(message: string, ...details: any) {
    this._print('verbose', message, details);
  }
}
