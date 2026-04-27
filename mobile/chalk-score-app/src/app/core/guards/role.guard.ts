import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { filter, switchMap, map, catchError } from 'rxjs/operators';
import { AuthService } from '@auth0/auth0-angular';
import { ProfileService } from '../../profile/profile.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private profile: ProfileService,
    private router: Router,
  ) {}

  canActivate(): Observable<boolean> {
    return this.auth.isLoading$.pipe(
      filter(loading => !loading),
      switchMap(() => this.auth.isAuthenticated$),
      switchMap(authenticated => {
        if (!authenticated) {
          this.router.navigate(['/login']);
          return of(false);
        }
        return this.profile.getMe().pipe(
          map(p => {
            if (p.role === 'Pending') {
              this.router.navigate(['/pending']);
              return false;
            }
            return true;
          }),
          catchError(() => {
            this.router.navigate(['/login']);
            return of(false);
          }),
        );
      }),
    );
  }
}
