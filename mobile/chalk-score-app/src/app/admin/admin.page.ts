import { Component, OnInit } from '@angular/core';
import { ActionSheetController, ToastController } from '@ionic/angular';
import { AdminService } from './admin.service';
import { PendingUser, StaffUser } from './admin.model';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  standalone: false,
})
export class AdminPage implements OnInit {
  pendingUsers: PendingUser[] = [];
  activeUsers: StaffUser[] = [];
  loading = false;

  constructor(
    private service: AdminService,
    private toast: ToastController,
    private actionSheet: ActionSheetController,
  ) {}

  ngOnInit() {
    this.load();
  }

  async load(showSpinner = true): Promise<void> {
    if (showSpinner) this.loading = true;
    try {
      const [pending, active] = await Promise.all([
        this.service.getPendingUsers().toPromise(),
        this.service.getActiveUsers().toPromise(),
      ]);
      this.pendingUsers = pending ?? [];
      this.activeUsers = active ?? [];
    } catch {
      this.showToast('Failed to load users', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleRefresh(event: CustomEvent) {
    await this.load(false);
    (event.target as HTMLIonRefresherElement).complete();
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

  async openUserOptions(user: StaffUser) {
    const roleOption = user.role === 'Coach'
      ? { text: 'Change to Staff', handler: () => this.updateRole(user, 'Staff') }
      : { text: 'Promote to Coach', handler: () => this.updateRole(user, 'Coach') };

    const adminOption = user.role === 'Coach'
      ? {
          text: user.isAdmin ? 'Remove Admin Access' : 'Grant Admin Access',
          handler: () => this.toggleAdmin(user),
        }
      : null;

    const sheet = await this.actionSheet.create({
      header: `${user.firstName} ${user.lastName}`,
      buttons: [
        roleOption,
        ...(adminOption ? [adminOption] : []),
        {
          text: 'Revoke Access',
          role: 'destructive',
          handler: () => this.revoke(user),
        },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private updateRole(user: StaffUser, role: string) {
    this.service.updateRole(user.id, role).subscribe({
      next: () => {
        user.role = role;
        if (role === 'Staff') user.isAdmin = false;
        this.showToast(`${user.firstName} ${user.lastName} updated to ${role}`);
      },
      error: () => this.showToast('Failed to update role', 'danger'),
    });
  }

  private toggleAdmin(user: StaffUser) {
    const newValue = !user.isAdmin;
    this.service.updateIsAdmin(user.id, newValue).subscribe({
      next: () => {
        user.isAdmin = newValue;
        this.showToast(newValue
          ? `${user.firstName} ${user.lastName} is now an admin`
          : `Admin access removed for ${user.firstName} ${user.lastName}`);
      },
      error: () => this.showToast('Failed to update admin status', 'danger'),
    });
  }

  private revoke(user: StaffUser) {
    this.service.revokeUser(user.id).subscribe({
      next: () => {
        this.activeUsers = this.activeUsers.filter(u => u.id !== user.id);
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
