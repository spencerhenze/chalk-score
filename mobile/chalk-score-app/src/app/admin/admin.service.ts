import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { PendingUser, StaffUser } from './admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiService) {}

  getPendingUsers(): Observable<PendingUser[]> {
    return this.api.get<PendingUser[]>('admin/pending-users');
  }

  getStaffUsers(): Observable<StaffUser[]> {
    return this.api.get<StaffUser[]>('admin/staff-users');
  }

  deleteUser(userId: string): Observable<void> {
    return this.api.delete<void>(`admin/users/${userId}`);
  }

  approveUser(userId: string): Observable<void> {
    return this.api.post<void>(`admin/users/${userId}/approve`, {});
  }

  revokeUser(userId: string): Observable<void> {
    return this.api.post<void>(`admin/users/${userId}/revoke`, {});
  }
}
