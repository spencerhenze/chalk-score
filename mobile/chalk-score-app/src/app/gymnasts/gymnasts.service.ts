import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { Gymnast, CreateGymnastRequest, UpdateGymnastRequest, ImportResult } from './gymnast.model';

@Injectable({ providedIn: 'root' })
export class GymnastsService {
  constructor(private api: ApiService) {}

  getAll(sort = 'lastName'): Observable<Gymnast[]> {
    return this.api.get<Gymnast[]>(`gymnasts?sort=${sort}`);
  }

  create(request: CreateGymnastRequest): Observable<Gymnast> {
    return this.api.post<Gymnast>('gymnasts', request);
  }

  update(id: string, request: UpdateGymnastRequest): Observable<Gymnast> {
    return this.api.put<Gymnast>(`gymnasts/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`gymnasts/${id}`);
  }

  importCsv(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.upload<ImportResult>('gymnasts/import', formData);
  }
}
