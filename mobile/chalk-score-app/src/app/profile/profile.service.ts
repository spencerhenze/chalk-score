import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../core/services/api.service';
import { UserProfile } from './profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private cached: UserProfile | null = null;

  constructor(private api: ApiService) {}

  getMe(): Observable<UserProfile> {
    if (this.cached) return of(this.cached);
    return this.api.get<UserProfile>('users/me').pipe(
      tap(profile => (this.cached = profile))
    );
  }

  refresh(): Observable<UserProfile> {
    this.cached = null;
    return this.getMe();
  }

  clearCache(): void {
    this.cached = null;
  }
}
