import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { FeedbackModalComponent } from '../feedback/feedback-modal/feedback-modal.component';

const LONG_PRESS_MS = 600;
const MOTION_PREF_KEY = 'motionPermissionAsked';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {
  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private feedbackOpen = false;

  constructor(
    private modal: ModalController,
    private router: Router,
    private alertController: AlertController,
  ) {}

  onTabPressStart() {
    this.pressTimer = setTimeout(() => this.handleLongPress(), LONG_PRESS_MS);
  }

  onTabPressEnd() {
    if (this.pressTimer !== null) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  private async handleLongPress() {
    const win = window as any;
    const needsPermission =
      typeof win.DeviceMotionEvent?.requestPermission === 'function' &&
      !localStorage.getItem(MOTION_PREF_KEY);

    if (needsPermission) {
      const alert = await this.alertController.create({
        header: 'Shake to Report',
        message: 'Allow motion access so you can shake your phone to quickly report feedback.',
        buttons: [
          {
            text: 'Not Now',
            role: 'cancel',
            handler: () => localStorage.setItem(MOTION_PREF_KEY, 'skipped'),
          },
          {
            text: 'Allow',
            // This button tap IS a user gesture — iOS will show the system prompt.
            handler: () => {
              localStorage.setItem(MOTION_PREF_KEY, 'granted');
              win.DeviceMotionEvent.requestPermission().catch(() => {});
            },
          },
        ],
      });
      await alert.present();
      await alert.onDidDismiss();
    }

    this.openFeedbackModal();
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
