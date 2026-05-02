import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private clearingSession = false;

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!req.url.startsWith(environment.apiBaseUrl)) {
      return next.handle(req);
    }

    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token => {
        const authReq = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
        return next.handle(authReq).pipe(
          catchError((err: HttpErrorResponse) => {
            if (err.status === 401) {
              this.handleAuthFailure();
            }
            return throwError(() => err);
          }),
        );
      }),
      catchError(err => {
        // getAccessTokenSilently failed — refresh token expired or session invalidated
        this.handleAuthFailure();
        return throwError(() => err);
      }),
    );
  }

  private handleAuthFailure(): void {
    if (this.clearingSession) return;
    this.clearingSession = true;
    this.auth.logout({ openUrl: false }).subscribe({
      complete: () => this.navigateToLogin(),
      error: () => this.navigateToLogin(),
    });
  }

  private navigateToLogin(): void {
    this.router.navigate(['/login']).then(() => {
      this.clearingSession = false;
    });
  }
}
