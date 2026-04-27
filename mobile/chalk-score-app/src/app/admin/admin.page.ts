import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AdminService } from './admin.service';
import { PendingUser, StaffUser } from './admin.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  standalone: false,
})
export class AdminPage implements OnInit {
  pendingUsers: PendingUser[] = [];
  staffUsers: StaffUser[] = [];
  loading = false;

  constructor(private service: AdminService, private toast: ToastController) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    Promise.all([
      this.service.getPendingUsers().toPromise(),
      this.service.getStaffUsers().toPromise(),
    ]).then(([pending, staff]) => {
      this.pendingUsers = pending ?? [];
      this.staffUsers = staff ?? [];
      this.loading = false;
    }).catch(() => {
      this.loading = false;
      this.showToast('Failed to load users', 'danger');
    });
  }

  deleteUser(user: PendingUser) {
    this.service.deleteUser(user.id).subscribe({
      next: () => {
        this.pendingUsers = this.pendingUsers.filter(u => u.id !== user.id);
        this.showToast(`${user.firstName} ${user.lastName} removed`, 'warning');
      },
      error: () => this.showToast('Failed to remove user', 'danger'),
    });
  }

  approve(user: PendingUser) {
    this.service.approveUser(user.id).subscribe({
      next: () => {
        this.showToast(`${user.firstName} ${user.lastName} approved`);
        this.load();
      },
      error: () => this.showToast('Failed to approve user', 'danger'),
    });
  }

  revoke(user: StaffUser) {
    this.service.revokeUser(user.id).subscribe({
      next: () => {
        this.staffUsers = this.staffUsers.filter(u => u.id !== user.id);
        this.showToast(`${user.firstName} ${user.lastName} access revoked`, 'warning');
      },
      error: () => this.showToast('Failed to revoke user', 'danger'),
    });
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
