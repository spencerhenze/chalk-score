import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { TestEntryService } from './test-entry.service';
import { TestEntryResponse, ExerciseResult } from './test-entry.model';

@Component({
  selector: 'app-test-entry',
  templateUrl: './test-entry.page.html',
  standalone: false,
})
export class TestEntryPage implements OnInit {
  sessionId!: string;
  tsgId!: string;

  entry: TestEntryResponse | null = null;
  form!: FormGroup;
  loading = false;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private service: TestEntryService,
    private alert: AlertController,
    private toast: ToastController,
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId')!;
    this.tsgId     = this.route.snapshot.paramMap.get('tsgId')!;
    this.load();
  }

  load() {
    this.loading = true;
    this.service.getEntry(this.sessionId, this.tsgId).subscribe({
      next: entry => {
        this.entry   = entry;
        this.form    = this.buildForm(entry.results);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to load test entry', 'danger');
      },
    });
  }

  private buildForm(results: ExerciseResult[]): FormGroup {
    const controls: Record<string, unknown[]> = {};
    for (const r of results) {
      const max = r.scoringType === 'Percentage' ? 100 : r.maxValue;
      controls[r.exerciseId] = [
        r.rawValue ?? 0,
        [Validators.required, Validators.min(0), Validators.max(Number(max))],
      ];
    }
    return this.fb.group(controls);
  }

  save() {
    if (!this.entry || this.form.invalid) return;
    this.saving = true;
    const results = this.entry.results.map(r => ({
      exerciseId: r.exerciseId,
      rawValue:   Number(this.form.value[r.exerciseId]) || 0,
    }));
    this.service.saveResults(this.sessionId, this.tsgId, results).subscribe({
      next: entry => {
        this.entry  = entry;
        this.saving = false;
        this.showToast('Scores saved');
      },
      error: () => {
        this.saving = false;
        this.showToast('Failed to save scores', 'danger');
      },
    });
  }

  async confirmComplete() {
    const a = await this.alert.create({
      header: 'Complete Test',
      message: 'Mark this test as complete? The final score will be calculated and no further changes can be made.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Complete',
          handler: () => this.doComplete(),
        },
      ],
    });
    await a.present();
  }

  private doComplete() {
    this.saving = true;
    const results = this.entry!.results.map(r => ({
      exerciseId: r.exerciseId,
      rawValue:   Number(this.form.value[r.exerciseId]) || 0,
    }));

    this.service.saveResults(this.sessionId, this.tsgId, results).subscribe({
      next: () => {
        this.service.complete(this.sessionId, this.tsgId).subscribe({
          next: entry => {
            this.entry  = entry;
            this.saving = false;
            this.showToast(`Test complete! Final score: ${entry.finalScore?.toFixed(1)}`);
            setTimeout(() => this.router.navigate(['/tabs/sessions', this.sessionId], { replaceUrl: true }), 1500);
          },
          error: () => {
            this.saving = false;
            this.showToast('Failed to complete test', 'danger');
          },
        });
      },
      error: () => {
        this.saving = false;
        this.showToast('Failed to save scores before completing', 'danger');
      },
    });
  }

  scoreFor(exerciseId: string): number {
    if (!this.entry) return 0;
    const raw = Number(this.form?.value[exerciseId]) || 0;
    const exercise = this.entry.results.find(r => r.exerciseId === exerciseId);
    if (!exercise) return 0;
    return this.calculatePreview(raw, exercise);
  }

  private calculatePreview(raw: number, ex: ExerciseResult): number {
    switch (ex.scoringType) {
      case 'Linear':
      case 'Timed':
      case 'Decimal':
        return ex.maxValue > 0 ? Math.min((raw / Number(ex.maxValue)) * 100, 100) : 0;
      case 'Percentage':
        return Math.min(Math.max(raw, 0), 100);
      case 'PassFail':
        return raw >= 1 ? 100 : 0;
      default:
        return 0;
    }
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'bottom' });
    await t.present();
  }
}
