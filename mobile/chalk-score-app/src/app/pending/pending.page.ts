import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Browser } from '@capacitor/browser';
import { ToastController } from '@ionic/angular';
import { switchMap } from 'rxjs/operators';
import { ProfileService } from '../profile/profile.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-pending',
  templateUrl: './pending.page.html',
  standalone: false,
})
export class PendingPage {
  checking = false;

  constructor(
    private auth: AuthService,
    private profile: ProfileService,
    private router: Router,
    private toast: ToastController,
  ) {}

  checkForApproval() {
    this.checking = true;
    this.auth.getAccessTokenSilently({ cacheMode: 'off' }).pipe(
      switchMap(() => this.profile.refresh()),
    ).subscribe({
      next: p => {
        this.checking = false;
        if (p.role !== 'Pending') {
          this.router.navigate(['/tabs/gymnasts'], { replaceUrl: true });
        } else {
          this.showToast('Not yet approved. Please check back later.', 'warning');
        }
      },
      error: () => {
        this.checking = false;
        this.showToast('Something went wrong. Please try again.', 'danger');
      },
    });
  }

  logout() {
    this.profile.clearCache();
    if (environment.nativeBrowser) {
      this.auth.logout({
        async openUrl(url) {
          await Browser.open({ url, windowName: '_self' });
        },
      });
    } else {
      this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
    }
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'bottom' });
    await t.present();
  }
}
