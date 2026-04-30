import { Component, Input, OnInit } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { ExercisesBuilderService } from './exercises-builder.service';
import { ExerciseItem } from './exercises-builder.model';

const MEASUREMENT_TYPES = ['Reps', 'Seconds', 'Decimal', 'Boolean', 'Percentage'];

@Component({
  selector: 'app-exercise-edit-modal',
  templateUrl: './exercise-edit-modal.component.html',
  standalone: false,
})
export class ExerciseEditModalComponent implements OnInit {
  @Input() exercise: ExerciseItem | null = null;

  name = '';
  description = '';
  measurementType = 'Reps';
  unit = '';
  saving = false;
  error: string | null = null;
  measurementTypes = MEASUREMENT_TYPES;

  get isEdit(): boolean { return !!this.exercise; }

  constructor(
    private modalCtrl: ModalController,
    private service: ExercisesBuilderService,
    private alert: AlertController,
    private toast: ToastController,
  ) {}

  ngOnInit() {
    if (this.exercise) {
      this.name            = this.exercise.name;
      this.description     = this.exercise.description ?? '';
      this.measurementType = this.exercise.measurementType;
      this.unit            = this.exercise.unit;
    }
  }

  get isValid(): boolean {
    return this.name.trim().length > 0 && this.unit.trim().length > 0;
  }

  save() {
    if (!this.isValid) return;
    this.saving = true;
    this.error  = null;
    const request = {
      name: this.name.trim(),
      description: this.description.trim() || null,
      measurementType: this.measurementType,
      unit: this.unit.trim(),
    };
    const call = this.isEdit
      ? this.service.update(this.exercise!.id, request)
      : this.service.create(request);

    call.subscribe({
      next: () => { this.saving = false; this.modalCtrl.dismiss(null, 'saved'); },
      error: async (err) => {
        this.saving = false;
        this.error = err?.error?.error ?? 'Failed to save exercise';
      },
    });
  }

  async confirmDelete() {
    const a = await this.alert.create({
      header: 'Delete Exercise',
      message: `Delete "${this.exercise!.name}"? This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => this.doDelete() },
      ],
    });
    await a.present();
  }

  private doDelete() {
    this.saving = true;
    this.service.delete(this.exercise!.id).subscribe({
      next: () => { this.saving = false; this.modalCtrl.dismiss(null, 'deleted'); },
      error: async (err) => {
        this.saving = false;
        this.error = err?.error?.error ?? 'Failed to delete exercise';
      },
    });
  }

  cancel() { this.modalCtrl.dismiss(null, 'cancel'); }
}
