import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PermissionsService } from '../core/services/permissions.service';

interface PermissionItem {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  status: 'pending' | 'granted' | 'denied' | 'skipped';
  request: () => Promise<void>;
}

@Component({
  selector: 'app-permissions-prompt',
  templateUrl: './permissions-prompt.component.html',
  styleUrls: ['./permissions-prompt.component.scss'],
  standalone: false,
})
export class PermissionsPromptComponent {
  permissions: PermissionItem[] = [
    {
      icon: 'phone-portrait-outline',
      iconColor: 'primary',
      title: 'Motion & Orientation',
      description: 'Shake your phone to quickly report feedback.',
      status: 'pending',
      request: () => this.requestMotion(),
    },
  ];

  constructor(
    private modalCtrl: ModalController,
    private permissionsService: PermissionsService,
  ) {}

  async requestMotion() {
    const item = this.permissions[0];
    const result = await this.permissionsService.requestMotionPermission();
    item.status = result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'pending';
  }

  skip(item: PermissionItem) {
    item.status = 'skipped';
    if (item.title === 'Motion & Orientation') {
      this.permissionsService.skipMotionPermission();
    }
  }

  done() {
    this.permissionsService.markSetupDone();
    this.modalCtrl.dismiss();
  }

  get allHandled(): boolean {
    return this.permissions.every(p => p.status !== 'pending');
  }
}
