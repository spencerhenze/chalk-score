import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { App as CapApp } from '@capacitor/app';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private auth: AuthService, private ngZone: NgZone, private router: Router) {
    if (environment.nativeBrowser) {
      CapApp.addListener('appUrlOpen', ({ url }) => {
        this.ngZone.run(() => {
          if (url.includes('state=') && (url.includes('code=') || url.includes('error='))) {
            this.auth.handleRedirectCallback(url).subscribe({
              next: () => this.router.navigate(['/tabs/gymnasts'], { replaceUrl: true }),
              error: (err) => console.error('Auth callback error:', err?.error, err?.error_description, err?.message),
            });
          }
        });
      });
    }
  }
}
