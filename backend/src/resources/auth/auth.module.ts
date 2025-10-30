import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from 'src/modules/mail/mail.module';
import { JwtConfig } from '../../config/config.interface';
import { DbModule } from '../../modules/db/db.module';
import { PermissionsModule } from '../../modules/permissions/permissions.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BasicAuthStrategy } from './strategies/basic-auth.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: async (config: ConfigService) => {
        const { secret, audience, issuer } = config.get<JwtConfig>('jwt');
        return {
          secret,
          verifyOptions: {
            audience,
            issuer,
          },
        };
      },
      inject: [ConfigService],
    }),
    DbModule,
    PermissionsModule,
    MailModule,
  ],
  providers: [AuthService, JwtStrategy, BasicAuthStrategy],
  exports: [AuthService],
})
export class AuthModule {}
