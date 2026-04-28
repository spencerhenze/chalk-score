import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { filter, take, switchMap, map, catchError, retry } from 'rxjs/operators';
import { AuthService } from '@auth0/auth0-angular';
import { ToastController } from '@ionic/angular';
import { ProfileService } from '../../profile/profile.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private profile: ProfileService,
    private router: Router,
    private toast: ToastController,
  ) {}

  canActivate(): Observable<boolean> {
    return this.auth.isLoading$.pipe(
      // Wait for Auth0 to finish initializing, then take exactly one snapshot.
      filter(loading => !loading),
      take(1),
      switchMap(() => this.auth.isAuthenticated$.pipe(take(1))),
      switchMap(authenticated => {
        if (!authenticated) {
          this.router.navigate(['/login']);
          return of(false);
        }
        return this.profile.getMe().pipe(
          retry({ count: 3, delay: (_, attempt) => timer(attempt * 3000) }),
          map(p => {
            if (p.role === 'Pending') {
              this.router.navigate(['/pending']);
              return false;
            }
            return true;
          }),
          catchError(() => {
            this.toast.create({
              message: 'Unable to reach server. Please try again.',
              duration: 3000,
              color: 'danger',
              position: 'bottom',
            }).then(t => t.present());
            return of(false);
          }),
        );
      }),
    );
  }
}
