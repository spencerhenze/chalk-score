import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { FeedbackModalComponent } from '../feedback/feedback-modal/feedback-modal.component';

const LONG_PRESS_MS = 600;

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {
  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private feedbackOpen = false;
  // Requested once per session; subsequent app launches use the cached OS permission.
  private static motionPermissionRequested = false;

  constructor(private modal: ModalController, private router: Router) {}

  async onTabPressStart() {
    const win = window as any;
    if (!TabsPage.motionPermissionRequested &&
        typeof win.DeviceMotionEvent?.requestPermission === 'function') {
      TabsPage.motionPermissionRequested = true;
      try { await win.DeviceMotionEvent.requestPermission(); } catch { /* denied or unavailable */ }
    }
    this.pressTimer = setTimeout(() => this.openFeedbackModal(), LONG_PRESS_MS);
  }

  onTabPressEnd() {
    if (this.pressTimer !== null) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
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
