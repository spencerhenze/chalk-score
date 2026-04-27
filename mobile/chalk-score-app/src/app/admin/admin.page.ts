import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AdminService } from './admin.service';
import { PendingUser } from './admin.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  standalone: false,
})
export class AdminPage implements OnInit {
  pendingUsers: PendingUser[] = [];
  loading = false;

  constructor(private service: AdminService, private toast: ToastController) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.service.getPendingUsers().subscribe({
      next: users => {
        this.pendingUsers = users;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to load pending users', 'danger');
      },
    });
  }

  approve(user: PendingUser) {
    this.service.approveUser(user.id).subscribe({
      next: () => {
        this.pendingUsers = this.pendingUsers.filter(u => u.id !== user.id);
        this.showToast(`${user.firstName} ${user.lastName} approved`);
      },
      error: () => this.showToast('Failed to approve user', 'danger'),
    });
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
