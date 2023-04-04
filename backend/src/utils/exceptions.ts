import { HttpException, HttpStatus } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ValidationError } from 'class-validator';
import { startCase } from 'lodash';
import { serialize } from './serialize';

export class CustomHttpException extends HttpException {
  constructor(status: HttpStatus, public code: string, public details?: any) {
    super(code, status);
    this.message =
      status === 500
        ? 'Internal Server Error'
        : startCase(this.code.replace(/_/g, ' '));
  }

  getResponse() {
    return {
      code: this.code,
      message: this.message,
    };
  }

  getLogDetails(): any {
    if (this.details || !this.isDefaultCode()) {
      return {
        code: this.code,
        ...(this.details ? serialize(this.details) : {}),
      };
    }
  }

  isDefaultCode(): boolean {
    return false;
  }
}

export class CustomBadRequestException extends CustomHttpException {
  constructor(code = 'bad_request', details?: any) {
    super(HttpStatus.BAD_REQUEST, code, details);
  }

  isDefaultCode() {
    return this.code === 'bad_request';
  }
}

export class CustomValidationException extends CustomHttpException {
  constructor(details: ValidationError[]) {
    super(HttpStatus.BAD_REQUEST, 'validation_error', details);
  }

  isDefaultCode() {
    return true;
  }

  getResponse() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class CustomUnauthorizedException extends CustomHttpException {
  constructor(code = 'unauthorized', details?: any) {
    super(HttpStatus.UNAUTHORIZED, code, details);
  }

  isDefaultCode() {
    return this.code === 'unauthorized';
  }
}

export class CustomForbiddenException extends CustomHttpException {
  constructor(code = 'forbidden', details?: any) {
    super(HttpStatus.FORBIDDEN, code, details);
  }

  isDefaultCode() {
    return this.code === 'forbidden';
  }
}

export class CustomNotFoundException extends CustomHttpException {
  constructor(code = 'not_found', details?: any) {
    super(HttpStatus.NOT_FOUND, code, details);
  }

  isDefaultCode() {
    return this.code === 'not_found';
  }
}

export class CustomInternalServerException extends CustomHttpException {
  constructor(code = 'internal_server_error', details?: any) {
    super(HttpStatus.INTERNAL_SERVER_ERROR, code, details);
  }

  isDefaultCode() {
    return this.code === 'internal_server_error';
  }
}

export class CustomWsException extends WsException {
  constructor(private code = 'internal_server_error') {
    super(code);

    this.message = startCase(this.code.replace(/_/g, ' '));
  }
}
