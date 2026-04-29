import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonInput, ToastController } from '@ionic/angular';
import { Keyboard } from '@capacitor/keyboard';
import { TestEntryService } from './test-entry.service';
import { TestEntryResponse, ExerciseResult } from './test-entry.model';

@Component({
  selector: 'app-test-entry',
  templateUrl: './test-entry.page.html',
  standalone: false,
})
export class TestEntryPage implements OnInit {
  @ViewChildren(IonInput) inputs!: QueryList<IonInput>;

  sessionId!: string;
  tsgId!: string;

  entry: TestEntryResponse | null = null;
  scores: Record<string, number | null> = {};
  loading = false;
  saving = false;
  focusedIndex = -1;
  private blurTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
        this.scores  = this.buildScores(entry.results);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to load test entry', 'danger');
      },
    });
  }

  private buildScores(results: ExerciseResult[]): Record<string, number | null> {
    const scores: Record<string, number | null> = {};
    for (const r of results) {
      scores[r.exerciseId] = r.rawValue ?? null;
    }
    return scores;
  }

  get isFormValid(): boolean {
    if (!this.entry) return false;
    return this.entry.results.every(r => !this.errorFor(r.exerciseId));
  }

  errorFor(exerciseId: string): string | null {
    if (!this.entry) return null;
    const ex = this.entry.results.find(r => r.exerciseId === exerciseId);
    if (!ex) return null;
    const val = this.scores[exerciseId];
    if (val === null || val === undefined || isNaN(val as number)) return 'Required';
    const max = ex.scoringType === 'Percentage' ? 100 : Number(ex.maxValue);
    if ((val as number) < 0) return 'Must be ≥ 0';
    if (!isNaN(max) && (val as number) > max) return `Max is ${max}`;
    return null;
  }

  updateScore(exerciseId: string, value: string | null | undefined): void {
    this.scores[exerciseId] = value == null || value === '' ? null : Number(value);
  }

  save() {
    if (!this.entry || !this.isFormValid) return;
    this.saving = true;
    const results = this.entry.results.map(r => ({
      exerciseId: r.exerciseId,
      rawValue:   this.scores[r.exerciseId] ?? 0,
    }));
    this.service.saveResults(this.sessionId, this.tsgId, results).subscribe({
      next: entry => {
        this.entry  = entry;
        this.scores = this.buildScores(entry.results);
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
      rawValue:   this.scores[r.exerciseId] ?? 0,
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

  onFocus(index: number) {
    if (this.blurTimer) clearTimeout(this.blurTimer);
    this.focusedIndex = index;
  }

  onBlur() {
    this.blurTimer = setTimeout(() => { this.focusedIndex = -1; }, 150);
  }

  focusPrev() {
    this.inputs.toArray()[this.focusedIndex - 1]?.setFocus();
  }

  focusNext() {
    this.inputs.toArray()[this.focusedIndex + 1]?.setFocus();
  }

  async dismissKeyboard() {
    await Keyboard.hide();
    this.focusedIndex = -1;
  }

  scoreFor(exerciseId: string): number {
    if (!this.entry) return 0;
    const val = this.scores[exerciseId];
    if (val === null || val === undefined) return 0;
    const exercise = this.entry.results.find(r => r.exerciseId === exerciseId);
    if (!exercise) return 0;
    return this.calculatePreview(val, exercise);
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
