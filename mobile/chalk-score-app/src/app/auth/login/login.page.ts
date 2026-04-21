import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Browser } from '@capacitor/browser';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  constructor(public auth: AuthService) {}

  login() {
    this.auth.loginWithRedirect({
      async openUrl(url: string) {
        await Browser.open({ url, windowName: '_self' });
      },
    });
  }
}
