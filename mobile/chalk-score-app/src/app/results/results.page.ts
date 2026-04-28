import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin } from 'rxjs';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { SessionsService } from '../sessions/sessions.service';
import { ResultsService, SessionResultsResponse, SessionGymnastResult } from './results.service';
import { TestSession } from '../sessions/session.model';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-results',
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.scss'],
  standalone: false,
})
export class ResultsPage {
  sessions: TestSession[] = [];
  selectedSessionId: string | null = null;
  sessionResults: SessionResultsResponse | null = null;
  loading = false;
  loadingResults = false;

  constructor(
    private sessionsService: SessionsService,
    private resultsService: ResultsService,
    private toast: ToastController,
  ) {}

  ionViewWillEnter() {
    this.loadSessions();
  }

  async loadSessions(showSpinner = true): Promise<void> {
    if (showSpinner) this.loading = true;
    try {
      const { open, closed } = await firstValueFrom(forkJoin({
        open:   this.sessionsService.getOpen(),
        closed: this.sessionsService.getClosed(),
      }));
      this.sessions = [...open, ...closed].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      if (!this.selectedSessionId && this.sessions.length > 0) {
        this.selectSession(this.sessions[0].id);
      }
    } catch {
      this.showToast('Failed to load sessions', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleRefresh(event: CustomEvent) {
    await this.loadSessions(false);
    if (this.selectedSessionId) {
      await this.loadResultsForSession(this.selectedSessionId);
    }
    (event.target as HTMLIonRefresherElement).complete();
  }

  selectSession(id: string) {
    this.selectedSessionId = id;
    this.loadResultsForSession(id);
  }

  async exportCsv() {
    if (!this.sessionResults) return;

    const rows = [
      ['Rank', 'First Name', 'Last Name', 'Level', 'Test Configuration', 'Score', 'Completed'],
      ...this.ranked.map((r, i) => [
        i + 1,
        r.firstName,
        r.lastName,
        r.level,
        r.testConfigurationName,
        r.finalScore ?? '',
        r.isCompleted ? 'Yes' : 'No',
      ]),
    ];

    const csv = rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const fileName = `${this.sessionResults.sessionName.replace(/[^a-z0-9]/gi, '_')}_results.csv`;

    if (environment.nativeBrowser) {
      try {
        const { uri } = await Filesystem.writeFile({
          path: fileName,
          data: csv,
          directory: Directory.Cache,
          encoding: 'utf8' as any,
        });
        await Share.share({ title: fileName, files: [uri], dialogTitle: 'Export Results' });
      } catch {
        this.showToast('Failed to export results', 'danger');
      }
    } else {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  private async loadResultsForSession(id: string): Promise<void> {
    this.loadingResults = true;
    try {
      this.sessionResults = await firstValueFrom(this.resultsService.getSessionResults(id));
    } catch {
      this.showToast('Failed to load results', 'danger');
    } finally {
      this.loadingResults = false;
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
