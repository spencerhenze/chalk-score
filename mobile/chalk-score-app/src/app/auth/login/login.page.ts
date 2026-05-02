import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Browser } from '@capacitor/browser';
import { Subscription } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnDestroy {
  showRetry = false;

  private authSub: Subscription | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(public auth: AuthService, private router: Router) {}

  ionViewWillEnter() {
    this.showRetry = false;

    this.authSub = this.auth.isLoading$.pipe(
      filter(loading => !loading),
      take(1),
      switchMap(() => this.auth.isAuthenticated$),
      filter(authenticated => authenticated),
      take(1),
    ).subscribe(() => {
      this.router.navigate(['/tabs/gymnasts'], { replaceUrl: true });
      // If still here after 20s the guard timed out — reveal the retry button.
      this.retryTimer = setTimeout(() => (this.showRetry = true), 20000);
    });
  }

  ionViewWillLeave() {
    this.authSub?.unsubscribe();
    this.authSub = null;
    clearTimeout(this.retryTimer!);
    this.retryTimer = null;
    this.showRetry = false;
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  retry() {
    this.showRetry = false;
    this.auth.isAuthenticated$.pipe(take(1)).subscribe(authenticated => {
      if (authenticated) {
        this.router.navigate(['/tabs/gymnasts'], { replaceUrl: true });
        this.retryTimer = setTimeout(() => (this.showRetry = true), 20000);
      }
      // If not authenticated, the interceptor already cleared the session and the
      // template will switch to showing the sign-in button automatically.
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
