import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Environment } from '../config/config.interface';
import { CustomLogger } from './../modules/logger/logger.service';
import {
  CustomHttpException,
  CustomNotFoundException,
  CustomUnauthorizedException,
} from './exceptions';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private environment: Environment;
  private logger: CustomLogger;

  constructor(private configService: ConfigService) {
    this.environment = this.configService.get<Environment>('environment');
    this.logger = new CustomLogger(configService);
    this.logger.setContext('HttpExceptionFilter');
  }

  catch(_exception: HttpException | CustomHttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = _exception.getStatus();

    let exception: HttpException | CustomHttpException;
    switch (status) {
      case 401:
        exception = new CustomUnauthorizedException();
        break;
      case 404:
        exception = new CustomNotFoundException();
        break;
      default:
        exception = _exception;
    }

    response.status(status).json(exception.getResponse());

    if (status === 400 && this.environment !== Environment.LOCAL) {
      return;
    }

    const method = request.method;
    const url = request.url;

    const message = `${method.toUpperCase()} ${url} - ${status} ${
      exception.message
    }`;

    const details =
      exception instanceof CustomHttpException
        ? exception.getLogDetails()
        : exception.getResponse();

    this.logger.error(message, details);
  }
}
