import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { PermissionsPromptComponent } from '../permissions-prompt/permissions-prompt.component';
import { PermissionsService } from '../core/services/permissions.service';
import { AdminModeService } from '../core/services/admin-mode.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {
  private static permissionsPromptShown = false;

  constructor(
    private modal: ModalController,
    private permissions: PermissionsService,
    public adminMode: AdminModeService,
  ) {}

  async ionViewDidEnter() {
    if (TabsPage.permissionsPromptShown || this.permissions.isSetupDone) return;
    TabsPage.permissionsPromptShown = true;

    const m = await this.modal.create({
      component: PermissionsPromptComponent,
      backdropDismiss: false,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await m.present();
  }
}
