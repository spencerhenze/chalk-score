import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Browser } from '@capacitor/browser';
import { ModalController, ToastController } from '@ionic/angular';
import { FeedbackModalComponent } from '../feedback/feedback-modal/feedback-modal.component';
import { firstValueFrom } from 'rxjs';
import { ProfileService } from './profile.service';
import { UserProfile } from './profile.model';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  standalone: false,
})
export class ProfilePage implements OnInit {
  profile: UserProfile | null = null;
  picture: string | null = null;
  loading = false;

  constructor(
    private service: ProfileService,
    public auth: AuthService,
    private toast: ToastController,
    private router: Router,
    private modal: ModalController,
  ) {}

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      this.picture = user?.picture ?? null;
    });
    this.load();
  }

  async load(showSpinner = true): Promise<void> {
    if (showSpinner) this.loading = true;
    try {
      this.profile = await firstValueFrom(this.service.refresh());
    } catch {
      this.showToast('Failed to load profile', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleRefresh(event: CustomEvent) {
    await this.load(false);
    (event.target as HTMLIonRefresherElement).complete();
  }

  async sendFeedback() {
    const m = await this.modal.create({
      component: FeedbackModalComponent,
      componentProps: { currentPage: this.router.url },
      breakpoints: [0, 0.75, 1],
      initialBreakpoint: 0.75,
    });
    await m.present();
  }

  openSettings() {
    this.router.navigate(['/tabs/settings']);
  }

  manageUsers() {
    this.router.navigate(['/tabs/admin']);
  }

  logout() {
    this.service.clearCache();
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
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
