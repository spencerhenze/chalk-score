import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { ModalController } from '@ionic/angular';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { filter, take } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { FeedbackModalComponent } from './feedback/feedback-modal/feedback-modal.component';
import { ErrorBufferService } from './core/services/error-buffer.service';
import { PermissionsService } from './core/services/permissions.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  private feedbackOpen = false;

  constructor(
    private auth: AuthService,
    private ngZone: NgZone,
    private router: Router,
    private modal: ModalController,
    private errorBuffer: ErrorBufferService,
    private permissions: PermissionsService,
  ) {
    if (environment.nativeBrowser) {
      CapApp.addListener('appUrlOpen', ({ url }) => {
        this.ngZone.run(() => {
          if (url.includes('state=') && (url.includes('code=') || url.includes('error='))) {
            this.auth.handleRedirectCallback(url).subscribe({
              next: () => {
                Browser.close();
                // Wait for Auth0 to update isAuthenticated$ before navigating,
                // otherwise the guard may sample false and redirect back to /login.
                this.auth.isAuthenticated$.pipe(
                  filter(a => a),
                  take(1),
                ).subscribe(() => {
                  this.router.navigate(['/tabs/gymnasts'], { replaceUrl: true });
                });
              },
              error: (err) => console.error('Auth callback error:', err?.error, err?.error_description, err?.message),
            });
          } else if (url.startsWith('com.chalkscore.app://callback')) {
            Browser.close();
            this.router.navigate(['/login'], { replaceUrl: true });
          }
        });
      });

      this.permissions.onShake(() => this.openFeedbackModal(), 40, 2000);
    }
  }

  async openFeedbackModal() {
    if (this.feedbackOpen) return;
    this.feedbackOpen = true;
    const m = await this.modal.create({
      component: FeedbackModalComponent,
      componentProps: { currentPage: this.router.url },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    m.onDidDismiss().then(() => (this.feedbackOpen = false));
    await m.present();
  }
}
