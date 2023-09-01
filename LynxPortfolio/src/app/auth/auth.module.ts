import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthRoutingModule } from './auth-routing.module';
/* Modules */
import { SharedModule } from '../shared/shared.module';
/* Components */
import { LoginComponent } from './components/login/login.component';
@NgModule({
  declarations: [LoginComponent],
  imports: [CommonModule, AuthRoutingModule, SharedModule],
  exports: [LoginComponent],
})
export class AuthModule {}
