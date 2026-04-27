import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { PendingUser } from './admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiService) {}

  getPendingUsers(): Observable<PendingUser[]> {
    return this.api.get<PendingUser[]>('admin/pending-users');
  }

  approveUser(userId: string): Observable<void> {
    return this.api.post<void>(`admin/users/${userId}/approve`, {});
  }
}
