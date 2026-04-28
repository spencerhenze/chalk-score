import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { ModalController } from '@ionic/angular';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Motion } from '@capacitor/motion';
import { environment } from '../environments/environment';
import { FeedbackModalComponent } from './feedback/feedback-modal/feedback-modal.component';
import { ErrorBufferService } from './core/services/error-buffer.service';

const SHAKE_THRESHOLD = 15;
const SHAKE_COOLDOWN_MS = 3000;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  private lastShakeAt = 0;
  private feedbackOpen = false;

  constructor(
    private auth: AuthService,
    private ngZone: NgZone,
    private router: Router,
    private modal: ModalController,
    // Injecting ErrorBufferService here ensures console.error is patched on startup.
    private errorBuffer: ErrorBufferService,
  ) {
    if (environment.nativeBrowser) {
      CapApp.addListener('appUrlOpen', ({ url }) => {
        this.ngZone.run(() => {
          if (url.includes('state=') && (url.includes('code=') || url.includes('error='))) {
            this.auth.handleRedirectCallback(url).subscribe({
              next: () => {
                Browser.close();
                this.router.navigate(['/tabs/gymnasts'], { replaceUrl: true });
              },
              error: (err) => console.error('Auth callback error:', err?.error, err?.error_description, err?.message),
            });
          } else if (url.startsWith('com.chalkscore.app://callback')) {
            Browser.close();
            this.router.navigate(['/login'], { replaceUrl: true });
          }
        });
      });

      Motion.addListener('accel', (event) => {
        const { x, y, z } = event.accelerationIncludingGravity;
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();
        if (magnitude > SHAKE_THRESHOLD && now - this.lastShakeAt > SHAKE_COOLDOWN_MS) {
          this.lastShakeAt = now;
          this.ngZone.run(() => this.openFeedbackModal());
        }
      });
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
