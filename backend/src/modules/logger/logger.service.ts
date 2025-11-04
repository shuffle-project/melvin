import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  _print(level: LogLevel, message: string, details: any[]) {
    if (this.environment === Environment.TEST) {
      return;
    }

    let logDetails: any;

    try {
      let _details: any[] = [];

      if (this.context === 'Application' && details.length) {
        const [firstDetail, ...restDetails] = details;
        if (typeof firstDetail === 'string') {
          message = `${firstDetail}: ${message}`;
          if (restDetails.length) {
            _details = restDetails;
          }
        } else {
          _details = details;
        }
      } else if (details.length) {
        _details = details;
      }

      const filteredDetails = Array.isArray(_details)
        ? _details.filter((o) => !isNil(o)).map((o) => serialize(o))
        : _details;
      switch (filteredDetails.length) {
        case 0:
          break;
        case 1:
          logDetails = filteredDetails[0];
          break;
        default:
          logDetails = filteredDetails;
      }
    } catch (err) {
      logDetails = {
        code: 'serializing_log_details_failed',
        message: err.message,
      };
    }

    const timestamp = new Date().toISOString();

    if (this.environment === Environment.LOCAL) {
      const appendix = logDetails
        ? `\n${JSON.stringify(logDetails, null, 2)}`
        : '';
      console.log(
        `${timestamp} [${level}] ${message} - ${this.context}${appendix}`,
      );
    } else {
      console.log(
        JSON.stringify({
          timestamp,
          level,
          msg: message,
          context: this.context,
          ...(logDetails ? { details: logDetails } : {}),
        }),
      );
    }
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
