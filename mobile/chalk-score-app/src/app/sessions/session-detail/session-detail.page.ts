import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { SessionsService } from '../sessions.service';
import { TestSession, TestSessionGymnast } from '../session.model';
import { AddGymnastComponent } from '../add-gymnast/add-gymnast.component';

@Component({
  selector: 'app-session-detail',
  templateUrl: './session-detail.page.html',
  standalone: false,
})
export class SessionDetailPage {
  sessionId!: string;
  session: TestSession | null = null;
  gymnasts: TestSessionGymnast[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: SessionsService,
    private modal: ModalController,
    private alert: AlertController,
    private toast: ToastController,
  ) {}

  ionViewWillEnter() {
    this.sessionId = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  async handleRefresh(event: CustomEvent) {
    await new Promise<void>(resolve => {
      this.service.getGymnasts(this.sessionId).subscribe({
        next: gymnasts => { this.gymnasts = gymnasts; resolve(); },
        error: () => { this.showToast('Failed to load session', 'danger'); resolve(); },
      });
    });
    (event.target as HTMLIonRefresherElement).complete();
  }

  load() {
    this.loading = true;
    this.service.getGymnasts(this.sessionId).subscribe({
      next: gymnasts => {
        this.gymnasts = gymnasts;
        this.loading  = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to load session', 'danger');
      },
    });
  }

  async openAddGymnast() {
    const m = await this.modal.create({
      component: AddGymnastComponent,
      componentProps: {
        sessionId:    this.sessionId,
        alreadyAdded: this.gymnasts.map(g => g.gymnastId),
      },
    });
    await m.present();
    const { data, role } = await m.onWillDismiss();
    if (role !== 'save') return;
    this.service.addGymnast(this.sessionId, data).subscribe({
      next: () => { this.load(); this.showToast('Gymnast added to session'); },
      error: () => this.showToast('Failed to add gymnast', 'danger'),
    });
  }

  async confirmRemove(tsg: TestSessionGymnast) {
    const a = await this.alert.create({
      header: 'Remove Gymnast',
      message: `Remove ${tsg.firstName} ${tsg.lastName} from this session?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.service.removeGymnast(this.sessionId, tsg.id).subscribe({
              next: () => { this.load(); this.showToast('Gymnast removed'); },
              error: () => this.showToast('Failed to remove gymnast', 'danger'),
            });
          },
        },
      ],
    });
    await a.present();
  }

  enterScores(tsg: TestSessionGymnast) {
    this.router.navigate(['/tabs/sessions', this.sessionId, 'entry', tsg.id]);
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
