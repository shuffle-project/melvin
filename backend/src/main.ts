import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { CustomLogger } from './modules/logger/logger.service';
import { HttpExceptionFilter } from './utils/exception-filter';
import { CustomValidationException } from './utils/exceptions';
import { getVersion } from './utils/version';

async function bootstrap() {
  // App definition
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: true,
    cors: true,
  });

  const configService = app.get(ConfigService);

  // app.useWebSocketAdapter(new SocketAdapter(app));
  app.useWebSocketAdapter(new WsAdapter(app));

  // Logging
  const logger = new CustomLogger(configService);
  logger.setContext('Application');
  app.useLogger(logger);

  // Security headers
  app.use(
    helmet({
      //https://stackoverflow.com/questions/69243166/err-blocked-by-response-notsameorigin-cors-policy-javascript
      // TODO ? bentöigt, sonst gibt es Fehler beim Video download
      crossOriginResourcePolicy: false,
    }),
  );

  // Exception handlong
  app.useGlobalFilters(new HttpExceptionFilter(configService));

  // Input validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new CustomValidationException(errors),
    }),
  );

  // Swagger api doc
  const version = await getVersion();
  const config = new DocumentBuilder()
    .setTitle('Editor-Backend API documentation')
    .setDescription('REST-API documentation of the editor backend')
    .setVersion(version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start server
  await app.listen(3000);
}

bootstrap();
