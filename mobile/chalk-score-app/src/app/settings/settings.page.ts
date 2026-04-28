import { Component } from '@angular/core';
import { PermissionsService, PermissionStatus } from '../core/services/permissions.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  standalone: false,
})
export class SettingsPage {
  constructor(public permissionsService: PermissionsService) {}

  get motionStatus(): PermissionStatus {
    return this.permissionsService.motionStatus;
  }

  openSettings() {
    this.permissionsService.openAppSettings();
  }

  statusLabel(status: PermissionStatus): string {
    switch (status) {
      case 'granted':  return 'Allowed';
      case 'denied':   return 'Denied';
      case 'skipped':  return 'Skipped';
      default:         return 'Not set';
    }
  }

  statusColor(status: PermissionStatus): string {
    switch (status) {
      case 'granted': return 'success';
      case 'denied':  return 'danger';
      default:        return 'medium';
    }
  }
}
