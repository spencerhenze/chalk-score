import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminModeService {
  private _isAdminMode = new BehaviorSubject<boolean>(false);
  isAdminMode$ = this._isAdminMode.asObservable();

  get isAdminMode(): boolean { return this._isAdminMode.value; }

  constructor(private router: Router) {}

  enter(): void {
    this._isAdminMode.next(true);
    this.router.navigate(['/tabs/builder-exercises']);
  }

  exit(): void {
    this._isAdminMode.next(false);
    this.router.navigate(['/tabs/gymnasts']);
  }
}
