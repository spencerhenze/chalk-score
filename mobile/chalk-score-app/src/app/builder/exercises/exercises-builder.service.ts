import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ExerciseItem, CreateOrUpdateExerciseRequest } from './exercises-builder.model';

@Injectable({ providedIn: 'root' })
export class ExercisesBuilderService {
  constructor(private api: ApiService) {}

  getAll(): Observable<ExerciseItem[]> {
    return this.api.get<ExerciseItem[]>('exercises');
  }

  create(request: CreateOrUpdateExerciseRequest): Observable<ExerciseItem> {
    return this.api.post<ExerciseItem>('exercises', request);
  }

  update(id: string, request: CreateOrUpdateExerciseRequest): Observable<ExerciseItem> {
    return this.api.put<ExerciseItem>(`exercises/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`exercises/${id}`);
  }
}
