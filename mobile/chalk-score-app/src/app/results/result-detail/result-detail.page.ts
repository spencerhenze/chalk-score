import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { ResultsService, SessionResultsResponse, SessionGymnastResult } from '../results.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-result-detail',
  templateUrl: './result-detail.page.html',
  standalone: false,
})
export class ResultDetailPage implements OnInit {
  sessionId!: string;
  sessionResults: SessionResultsResponse | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private resultsService: ResultsService,
    private toast: ToastController,
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  async load(showSpinner = true): Promise<void> {
    if (showSpinner) this.loading = true;
    try {
      this.sessionResults = await firstValueFrom(this.resultsService.getSessionResults(this.sessionId));
    } catch {
      this.showToast('Failed to load results', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleRefresh(event: CustomEvent) {
    await this.load(false);
    (event.target as HTMLIonRefresherElement).complete();
  }

  async exportCsv() {
    if (!this.sessionResults) return;

    const rows = [
      ['Rank', 'First Name', 'Last Name', 'Level', 'Test Configuration', 'Score', 'Completed'],
      ...this.ranked.map((r, i) => [
        i + 1, r.firstName, r.lastName, r.level, r.testConfigurationName,
        r.finalScore ?? '', r.isCompleted ? 'Yes' : 'No',
      ]),
    ];

    const csv = rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const fileName = `${this.sessionResults.sessionName.replace(/[^a-z0-9]/gi, '_')}_results.csv`;

    if (environment.nativeBrowser) {
      try {
        const { uri } = await Filesystem.writeFile({
          path: fileName, data: csv, directory: Directory.Cache, encoding: 'utf8' as any,
        });
        await Share.share({ title: fileName, files: [uri], dialogTitle: 'Export Results' });
      } catch {
        this.showToast('Failed to export results', 'danger');
      }
    } else {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    }
  }

  get ranked(): SessionGymnastResult[] {
    if (!this.sessionResults) return [];
    return [...this.sessionResults.results].sort((a, b) => {
      if (a.finalScore === null && b.finalScore === null) return 0;
      if (a.finalScore === null) return 1;
      if (b.finalScore === null) return -1;
      return b.finalScore - a.finalScore;
    });
  }

  medalColor(index: number): string {
    return ['warning', 'medium', 'tertiary'][index] ?? '';
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
