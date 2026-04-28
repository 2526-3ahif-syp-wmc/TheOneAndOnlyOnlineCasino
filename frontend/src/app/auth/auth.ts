import { Component, inject, signal, WritableSignal } from '@angular/core';
import { form, FormField, minLength, pattern, required, submit, validate } from '@angular/forms/signals';
import { MatError } from '@angular/material/form-field';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-auth',
  imports: [RouterLink, FormField, MatError, MatButton],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  private service = inject(AuthService);

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
    required(path.username, {message: "Username is required to log in"});
    // pattern to check if username exists
    required(path.password, {message: "Password is required to log in"});
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
      this.service.logIn(username, password);
      this.loginFormModel.set(Auth.LOGIN_DEFAULT); 
    });
  }   

  protected async handleRegister() {
    await submit(this.registerForm, async form => {
      const data = form().value();
      const username = data.username;
      const password = data.password;
      this.service.register(username, password);
      this.loginFormModel.set(Auth.LOGIN_DEFAULT); 
    });
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

