import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { firstValueFrom, forkJoin } from 'rxjs';
import { SessionsService } from '../sessions/sessions.service';
import { ResultsService, SessionResultsResponse, SessionGymnastResult } from './results.service';
import { TestSession } from '../sessions/session.model';

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
