import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient = inject(HttpClient);

  public logIn(username: string, password: string) {
    
  }

  public register(username: string, password: string) {

  }
}
