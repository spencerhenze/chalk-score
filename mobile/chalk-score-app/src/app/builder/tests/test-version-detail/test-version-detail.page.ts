import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { TestsBuilderService } from '../tests-builder.service';
import { TestConfigDetail, ConfigExercise } from '../tests-builder.model';
import { AdminModeService } from '../../../core/services/admin-mode.service';
import { AddExerciseModalComponent } from '../add-exercise-modal/add-exercise-modal.component';

@Component({
  selector: 'app-test-version-detail',
  templateUrl: './test-version-detail.page.html',
  standalone: false,
})
export class TestVersionDetailPage implements OnInit {
  typeId!: string;
  configId!: string;
  config: TestConfigDetail | null = null;
  exercises: ConfigExercise[] = [];
  modifiedExerciseIds = new Set<string>();
  loading = false;
  saving = false;

  scoringTypes = ['Linear', 'Percentage', 'Timed', 'Tiered', 'PassFail', 'Decimal'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: TestsBuilderService,
    private modal: ModalController,
    private alert: AlertController,
    private toast: ToastController,
    public adminMode: AdminModeService,
  ) {}

  ngOnInit() {
    this.typeId   = this.route.snapshot.paramMap.get('typeId')!;
    this.configId = this.route.snapshot.paramMap.get('configId')!;
  }

  ionViewWillEnter() { this.load(); }

  load() {
    this.loading = true;
    this.service.getConfig(this.configId).subscribe({
      next: config => {
        this.config    = config;
        this.exercises = config.exercises.map(e => ({ ...e }));
        this.modifiedExerciseIds.clear();
        this.loading   = false;
      },
      error: () => { this.loading = false; this.showToast('Failed to load configuration', 'danger'); },
    });
  }

  get headerTitle(): string {
    if (!this.config) return '';
    const status = this.config.isDraft ? 'Draft' : (this.config.isActive ? 'Active' : 'Inactive');
    return `${this.config.testTypeName} v${this.config.version} — ${status}`;
  }

  onScoringParamChanged(exerciseId: string) {
    this.modifiedExerciseIds.add(exerciseId);
  }

  handleReorder(event: CustomEvent) {
    this.exercises = event.detail.complete(this.exercises);
  }

  removeExercise(index: number) {
    this.exercises.splice(index, 1);
  }

  async addExercise() {
    const existing = this.exercises.map(e => e.exerciseId);
    const m = await this.modal.create({
      component: AddExerciseModalComponent,
      componentProps: { excludeIds: existing },
    });
    await m.present();
    const { data, role } = await m.onWillDismiss();
    if (role !== 'selected' || !data) return;
    this.exercises.push({
      exerciseId:   data.id,
      name:         data.name,
      unit:         data.unit,
      measurementType: data.measurementType,
      scoringType:  'Linear',
      maxValue:     100,
      weight:       1,
      required:     true,
      displayOrder: this.exercises.length,
      scoringParams: null,
    });
  }

  async saveDraft() {
    if (!this.config) return;
    this.saving = true;
    const input = this.exercises.map((e, i) => ({
      exerciseId:   e.exerciseId,
      maxValue:     e.maxValue,
      weight:       e.weight,
      scoringType:  e.scoringType,
      scoringParams: e.scoringParams,
      displayOrder: i,
      required:     e.required,
    }));
    this.service.setExercises(this.configId, input).subscribe({
      next: config => {
        this.config    = config;
        this.exercises = config.exercises.map(e => ({ ...e }));
        this.saving    = false;
        this.showToast('Saved');
      },
      error: (err) => { this.saving = false; this.showToast(err?.error?.error ?? 'Failed to save', 'danger'); },
    });
  }

  async confirmPublish() {
    const a = await this.alert.create({
      header: 'Publish Configuration',
      message: 'Publishing activates this version and locks the exercise list. Scoring parameters can still be corrected after publishing.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Publish', handler: () => this.doPublish() },
      ],
    });
    await a.present();
  }

  private doPublish() {
    this.saving = true;
    this.service.publish(this.configId).subscribe({
      next: () => {
        this.saving = false;
        this.showToast('Published!');
        this.load();
      },
      error: (err) => { this.saving = false; this.showToast(err?.error?.error ?? 'Failed to publish', 'danger'); },
    });
  }

  async confirmDelete() {
    const a = await this.alert.create({
      header: 'Delete Draft',
      message: 'This draft will be permanently deleted.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => this.doDelete() },
      ],
    });
    await a.present();
  }

  private doDelete() {
    this.service.deleteVersion(this.configId).subscribe({
      next: () => this.router.navigate(['/tabs/builder-tests', this.typeId], { replaceUrl: true }),
      error: () => this.showToast('Failed to delete', 'danger'),
    });
  }

  async confirmCorrect() {
    if (this.modifiedExerciseIds.size === 0) return;
    const a = await this.alert.create({
      header: 'Correct & Recalculate',
      message: `This will recalculate scores for all sessions using this configuration. Continue?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Recalculate', handler: () => this.doCorrect() },
      ],
    });
    await a.present();
  }

  private async doCorrect() {
    this.saving = true;
    let totalSessions = 0;
    let totalGymnasts = 0;
    try {
      for (const exerciseId of this.modifiedExerciseIds) {
        const ex = this.exercises.find(e => e.exerciseId === exerciseId)!;
        const result = await firstValueFrom(this.service.patchExercise(this.configId, exerciseId, {
          maxValue: ex.maxValue,
          weight: ex.weight,
          scoringType: ex.scoringType,
          scoringParams: ex.scoringParams,
        }));
        totalSessions = Math.max(totalSessions, result.affectedSessions);
        totalGymnasts += result.affectedGymnasts;
      }
      this.modifiedExerciseIds.clear();
      this.saving = false;
      this.showToast(`Recalculated ${totalGymnasts} gymnast(s) across ${totalSessions} session(s)`);
    } catch {
      this.saving = false;
      this.showToast('Failed to recalculate', 'danger');
    }
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'bottom' });
    await t.present();
  }
}
