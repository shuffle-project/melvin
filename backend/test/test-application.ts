import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { ValidationError } from 'class-validator';
import { CustomValidationException } from '../src/utils/exceptions';

export const createTestApplication = (
  module: TestingModule,
): INestApplication => {
  const app = module.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new CustomValidationException(errors),
    }),
  );

  return app;
};
