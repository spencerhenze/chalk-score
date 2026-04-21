import { Component } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { SessionsService } from './sessions.service';
import { TestSession } from './session.model';
import { SessionFormComponent } from './session-form/session-form.component';

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.page.html',
  standalone: false,
})
export class SessionsPage {
  open: TestSession[] = [];
  closed: TestSession[] = [];
  loading = false;
  segment: 'open' | 'closed' = 'open';

  constructor(
    private service: SessionsService,
    private modal: ModalController,
    private alert: AlertController,
    private toast: ToastController,
  ) {}

  ionViewWillEnter() {
    this.load();
  }

  load() {
    this.loading = true;
    this.service.getOpen().subscribe({
      next: data => { this.open = data; this.loading = false; },
      error: () => { this.loading = false; this.showToast('Failed to load sessions', 'danger'); },
    });
    this.service.getClosed().subscribe({
      next: data => { this.closed = data; },
    });
  }

  get sessions() {
    return this.segment === 'open' ? this.open : this.closed;
  }

  async openCreate() {
    const m = await this.modal.create({ component: SessionFormComponent });
    await m.present();
    const { data, role } = await m.onWillDismiss();
    if (role !== 'save') return;
    this.service.create(data).subscribe({
      next: () => { this.load(); this.showToast('Session created'); },
      error: () => this.showToast('Failed to create session', 'danger'),
    });
  }

  async confirmClose(session: TestSession) {
    const a = await this.alert.create({
      header: 'Close Session',
      message: `Close "${session.name}"? No further scores can be entered.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Close Session',
          handler: () => {
            this.service.close(session.id).subscribe({
              next: () => { this.load(); this.showToast('Session closed'); },
              error: () => this.showToast('Failed to close session', 'danger'),
            });
          },
        },
      ],
    });
    await a.present();
  }

  async confirmDelete(session: TestSession) {
    const a = await this.alert.create({
      header: 'Delete Session',
      message: `Delete "${session.name}" and all its scores? This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.service.delete(session.id).subscribe({
              next: () => { this.load(); this.showToast('Session deleted'); },
              error: () => this.showToast('Failed to delete session', 'danger'),
            });
          },
        },
      ],
    });
    await a.present();
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
