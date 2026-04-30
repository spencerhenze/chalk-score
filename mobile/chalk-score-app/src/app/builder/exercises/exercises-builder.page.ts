import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ExercisesBuilderService } from './exercises-builder.service';
import { ExerciseEditModalComponent } from './exercise-edit-modal.component';
import { ExerciseItem } from './exercises-builder.model';
import { AdminModeService } from '../../core/services/admin-mode.service';

@Component({
  selector: 'app-exercises-builder',
  templateUrl: './exercises-builder.page.html',
  standalone: false,
})
export class ExercisesBuilderPage {
  exercises: ExerciseItem[] = [];
  loading = false;

  constructor(
    private service: ExercisesBuilderService,
    private modal: ModalController,
    private toast: ToastController,
    public adminMode: AdminModeService,
  ) {}

  ionViewWillEnter() { this.load(); }

  load() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: exercises => { this.exercises = exercises; this.loading = false; },
      error: () => { this.loading = false; this.showToast('Failed to load exercises', 'danger'); },
    });
  }

  async openCreate() {
    const m = await this.modal.create({ component: ExerciseEditModalComponent });
    await m.present();
    const { role } = await m.onWillDismiss();
    if (role === 'saved') this.load();
  }

  async openEdit(exercise: ExerciseItem) {
    const m = await this.modal.create({
      component: ExerciseEditModalComponent,
      componentProps: { exercise },
    });
    await m.present();
    const { role } = await m.onWillDismiss();
    if (role === 'saved' || role === 'deleted') this.load();
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
