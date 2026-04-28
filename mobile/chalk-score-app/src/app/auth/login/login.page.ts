import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Browser } from '@capacitor/browser';
import { filter, switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  constructor(public auth: AuthService, private router: Router) {}

  ionViewWillEnter() {
    // If the user already has a valid session (app restart), navigate to tabs.
    // take(1) ensures we only navigate once per page entry, preventing loops.
    this.auth.isLoading$.pipe(
      filter(loading => !loading),
      take(1),
      switchMap(() => this.auth.isAuthenticated$),
      take(1),
    ).subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigate(['/tabs/gymnasts'], { replaceUrl: true });
      }
    });
  }

  login() {
    if (environment.nativeBrowser) {
      this.auth.loginWithRedirect({
        async openUrl(url: string) {
          await Browser.open({ url, windowName: '_self' });
        },
      });
    } else {
      this.auth.loginWithRedirect();
    }
  }
}
