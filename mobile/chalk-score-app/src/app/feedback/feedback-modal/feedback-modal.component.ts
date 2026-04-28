import { Component, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { FeedbackService } from '../feedback.service';
import { ErrorBufferService } from '../../core/services/error-buffer.service';

@Component({
  selector: 'app-feedback-modal',
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.scss'],
  standalone: false,
})
export class FeedbackModalComponent {
  @Input() currentPage = '';

  type: 'Bug' | 'Feature' | null = null;
  description = '';
  stepsToReproduce = '';
  frequency: 'EveryTime' | 'Intermittent' | '' = '';
  isNewFeature: boolean | null = null;
  submitting = false;

  constructor(
    private modal: ModalController,
    private feedbackService: FeedbackService,
    private errorBuffer: ErrorBufferService,
    private toast: ToastController,
  ) {}

  dismiss() {
    this.modal.dismiss();
  }

  async submit() {
    if (!this.type || !this.description.trim()) return;

    this.submitting = true;
    try {
      await firstValueFrom(this.feedbackService.submit({
        type: this.type,
        description: this.description.trim(),
        stepsToReproduce: this.stepsToReproduce.trim() || undefined,
        frequency: (this.frequency || undefined) as any,
        isNewFeature: this.isNewFeature ?? undefined,
        currentPage: this.currentPage,
        consoleErrors: this.errorBuffer.drain() ?? undefined,
      }));

      const t = await this.toast.create({
        message: 'Feedback submitted. Thank you!',
        duration: 2500,
        color: 'success',
        position: 'bottom',
      });
      await t.present();
      this.modal.dismiss();
    } catch {
      const t = await this.toast.create({
        message: 'Failed to submit feedback. Please try again.',
        duration: 2500,
        color: 'danger',
        position: 'bottom',
      });
      await t.present();
    } finally {
      this.submitting = false;
    }
  }

  get canSubmit(): boolean {
    if (!this.type || !this.description.trim()) return false;
    if (this.type === 'Feature' && this.isNewFeature === null) return false;
    return true;
  }
}
