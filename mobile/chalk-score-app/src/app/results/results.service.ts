import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';

export interface SessionGymnastResult {
  testSessionGymnastId: string;
  gymnastId: string;
  firstName: string;
  lastName: string;
  level: number;
  testConfigurationName: string;
  isCompleted: boolean;
  finalScore: number | null;
}

export interface SessionResultsResponse {
  sessionId: string;
  sessionName: string;
  date: string;
  results: SessionGymnastResult[];
}

@Injectable({ providedIn: 'root' })
export class ResultsService {
  constructor(private api: ApiService) {}

  getSessionResults(sessionId: string): Observable<SessionResultsResponse> {
    return this.api.get<SessionResultsResponse>(`sessions/${sessionId}/results`);
  }
}
