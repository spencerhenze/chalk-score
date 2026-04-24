import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Browser } from '@capacitor/browser';
import { ToastController } from '@ionic/angular';
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
  ) {}

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      this.picture = user?.picture ?? null;
    });

    this.loading = true;
    this.service.getMe().subscribe({
      next: profile => {
        this.profile = profile;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to load profile', 'danger');
      },
    });
  }

  logout() {
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
