import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import {
  TestSession,
  TestSessionGymnast,
  CreateTestSessionRequest,
  AddGymnastToSessionRequest,
  TestConfigurationSummary,
} from './session.model';

@Injectable({ providedIn: 'root' })
export class SessionsService {
  constructor(private api: ApiService) {}

  getOpen(): Observable<TestSession[]> {
    return this.api.get<TestSession[]>('sessions/open');
  }

  getClosed(): Observable<TestSession[]> {
    return this.api.get<TestSession[]>('sessions/closed');
  }

  getGymnasts(sessionId: string): Observable<TestSessionGymnast[]> {
    return this.api.get<TestSessionGymnast[]>(`sessions/${sessionId}/gymnasts`);
  }

  create(request: CreateTestSessionRequest): Observable<TestSession> {
    return this.api.post<TestSession>('sessions', request);
  }

  close(sessionId: string): Observable<TestSession> {
    return this.api.post<TestSession>(`sessions/${sessionId}/close`, {});
  }

  delete(sessionId: string): Observable<void> {
    return this.api.delete<void>(`sessions/${sessionId}`);
  }

  addGymnast(sessionId: string, request: AddGymnastToSessionRequest): Observable<string> {
    return this.api.post<string>(`sessions/${sessionId}/gymnasts`, request);
  }

  removeGymnast(sessionId: string, tsgId: string): Observable<void> {
    return this.api.delete<void>(`sessions/${sessionId}/gymnasts/${tsgId}`);
  }

  getConfigurations(): Observable<TestConfigurationSummary[]> {
    return this.api.get<TestConfigurationSummary[]>('test-configurations');
  }
}
