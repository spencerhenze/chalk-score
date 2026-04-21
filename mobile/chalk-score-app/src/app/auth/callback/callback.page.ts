import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Browser } from '@capacitor/browser';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-callback',
  template: '<ion-content><ion-spinner name="crescent" class="ion-margin"></ion-spinner></ion-content>',
  standalone: false,
})
export class CallbackPage implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    Browser.close();

    this.auth.isAuthenticated$.pipe(
      filter(Boolean),
      take(1)
    ).subscribe(() => {
      this.router.navigate(['/tabs/gymnasts'], { replaceUrl: true });
    });
  }
}
