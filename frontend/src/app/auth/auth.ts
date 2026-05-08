import { Component, inject, signal, WritableSignal } from '@angular/core';
import { form, FormField, minLength, required, submit, validate } from '@angular/forms/signals';
import { MatError } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { UserService } from '../services/user-service';
import { MatButton } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { AlertService } from '../services/alert-service';

@Component({
  selector: 'app-auth',
  imports: [ FormField, MatError, MatButton],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  protected alertService = inject(AlertService);
  private service = inject(UserService);
  private router = inject(Router);

  private static readonly LOGIN_DEFAULT: LoginFormModel = {
    username: "",
    password: ""
  };

  private static readonly REGISTER_DEFAULT: RegisterFormModel = {
    username: "",
    password: "",
    confirmPassword: ""
  }; 

  protected readonly loginFormModel: WritableSignal<LoginFormModel> = signal(Auth.LOGIN_DEFAULT);

  protected readonly loginForm = form(this.loginFormModel, path => {
    required(path.username, {message: "Username is required to log in"});
    required(path.password, {message: "Password is required to log in"});
  });

  protected readonly registerFormModel: WritableSignal<RegisterFormModel> = signal(Auth.REGISTER_DEFAULT);

  protected readonly registerForm = form(this.registerFormModel, path => {
    required(path.username, {message: "Username is required to register"});
    required(path.password, {message: "Password is required to register"});
    minLength(path.password, 6 ,{message: "Password needs to be at least 6 characters long"});

    validate(path.confirmPassword, ({ value, valueOf }) => {
      return value() !== valueOf(path.password)
    ? { kind: "passwordMismatch", message: "Passwords do not match" }
    : null;
    });
  });

  protected async handleLogIn(){
    await submit(this.loginForm, async form => {
      const data = form().value();
      const username = data.username;
      const password = data.password;

      try {
      
        await firstValueFrom(
          this.service.logIn(username, password)
        );

        await this.delay(1000);

        this.loginFormModel.set(Auth.LOGIN_DEFAULT); 

        await this.router.navigate(['/home']);
      } catch (err: any) {
        console.log(err.error?.message ?? 'Log In failed');
        this.alertService.error("Log In Failed!")
      }
    });
  }   

  protected async handleRegister() {
    await submit(this.registerForm, async form => {
      const data = form().value();
      const username = data.username;
      const password = data.password;

      try {

        await firstValueFrom(
          this.service.register(username, password)
        );

        await this.delay(1000);
        
        this.alertService.info(`Account created. Please Log In!`)

        this.registerFormModel.set(Auth.REGISTER_DEFAULT); 
      } catch (err: any) {
        console.log(err.error?.message ?? 'Register failed');
        this.alertService.error("Register failed");
      } 
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

type LoginFormModel = {
  username: string;
  password: string;
}

type RegisterFormModel = {
  username: string;
  password: string;
  confirmPassword: string;
}

