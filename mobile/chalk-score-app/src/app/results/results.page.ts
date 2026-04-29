import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin } from 'rxjs';
import { SessionsService } from '../sessions/sessions.service';
import { TestSession } from '../sessions/session.model';

@Component({
  selector: 'app-results',
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.scss'],
  standalone: false,
})
export class ResultsPage {
  sessions: TestSession[] = [];
  loading = false;

  constructor(
    private sessionsService: SessionsService,
    private toast: ToastController,
    private router: Router,
  ) {}

  ionViewWillEnter() {
    this.load();
  }

  async load(showSpinner = true): Promise<void> {
    if (showSpinner) this.loading = true;
    try {
      const { open, closed } = await firstValueFrom(forkJoin({
        open:   this.sessionsService.getOpen(),
        closed: this.sessionsService.getClosed(),
      }));
      this.sessions = [...open, ...closed].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch {
      this.showToast('Failed to load sessions', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleRefresh(event: CustomEvent) {
    await this.load(false);
    (event.target as HTMLIonRefresherElement).complete();
  }

  openSession(id: string) {
    this.router.navigate(['/tabs/results', id]);
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
