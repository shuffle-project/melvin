import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FooterModule } from '../../components/footer/footer.module';
import { LogoModule } from '../../components/logo/logo.module';
import { SharedModule } from '../../modules/shared/shared.module';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthComponent } from './auth.component';
import { LoginComponent } from './components/login/login.component';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { RegisterComponent } from './components/register/register.component';

@NgModule({
  declarations: [
    AuthComponent,
    LoginComponent,
    RegisterComponent,
    PasswordResetComponent,
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    SharedModule,
    LogoModule,
    FooterModule,
  ],
})
export class AuthModule {}
