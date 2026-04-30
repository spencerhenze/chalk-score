import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TestTypeItem, TestConfigDetail, ExerciseConfigInput } from './tests-builder.model';

@Injectable({ providedIn: 'root' })
export class TestsBuilderService {
  constructor(private api: ApiService) {}

  getTestTypes(): Observable<TestTypeItem[]> {
    return this.api.get<TestTypeItem[]>('test-types');
  }

  createTestType(name: string, description: string | null): Observable<{ testTypeId: string; configurationId: string; version: number }> {
    return this.api.post<any>('test-types', { name, description });
  }

  getConfig(configId: string): Observable<TestConfigDetail> {
    return this.api.get<TestConfigDetail>(`test-configurations/${configId}`);
  }

  createVersion(testTypeId: string, copyFromConfigurationId?: string): Observable<{ id: string; version: number }> {
    return this.api.post<any>('test-configurations', { testTypeId, copyFromConfigurationId });
  }

  setExercises(configId: string, exercises: ExerciseConfigInput[]): Observable<TestConfigDetail> {
    return this.api.put<TestConfigDetail>(`test-configurations/${configId}/exercises`, { exercises });
  }

  publish(configId: string): Observable<{ id: string; version: number; isDraft: boolean; isActive: boolean }> {
    return this.api.put<any>(`test-configurations/${configId}/publish`, {});
  }

  patchExercise(configId: string, exerciseId: string, patch: { maxValue?: number; weight?: number; scoringType?: string; scoringParams?: string | null }): Observable<{ affectedSessions: number; affectedGymnasts: number }> {
    return this.api.patch<any>(`test-configurations/${configId}/exercises/${exerciseId}`, patch);
  }

  deleteVersion(configId: string): Observable<void> {
    return this.api.delete<void>(`test-configurations/${configId}`);
  }

  deleteTestType(typeId: string): Observable<void> {
    return this.api.delete<void>(`test-types/${typeId}`);
  }
}
