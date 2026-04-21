import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TestEntryResponse, ExerciseResultInput } from './test-entry.model';

@Injectable({ providedIn: 'root' })
export class TestEntryService {
  constructor(private api: ApiService) {}

  getEntry(sessionId: string, tsgId: string): Observable<TestEntryResponse> {
    return this.api.get<TestEntryResponse>(`sessions/${sessionId}/gymnasts/${tsgId}`);
  }

  saveResults(sessionId: string, tsgId: string, results: ExerciseResultInput[]): Observable<TestEntryResponse> {
    return this.api.put<TestEntryResponse>(`sessions/${sessionId}/gymnasts/${tsgId}/results`, { results });
  }

  complete(sessionId: string, tsgId: string): Observable<TestEntryResponse> {
    return this.api.post<TestEntryResponse>(`sessions/${sessionId}/gymnasts/${tsgId}/complete`, {});
  }
}
