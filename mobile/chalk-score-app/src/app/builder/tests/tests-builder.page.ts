import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { TestsBuilderService } from './tests-builder.service';
import { TestTypeItem } from './tests-builder.model';
import { AdminModeService } from '../../core/services/admin-mode.service';

@Component({
  selector: 'app-tests-builder',
  templateUrl: './tests-builder.page.html',
  standalone: false,
})
export class TestsBuilderPage {
  testTypes: TestTypeItem[] = [];
  loading = false;

  constructor(
    private service: TestsBuilderService,
    private router: Router,
    private alert: AlertController,
    private toast: ToastController,
    public adminMode: AdminModeService,
  ) {}

  ionViewWillEnter() { this.load(); }

  load() {
    this.loading = true;
    this.service.getTestTypes().subscribe({
      next: types => { this.testTypes = types; this.loading = false; },
      error: () => { this.loading = false; this.showToast('Failed to load tests', 'danger'); },
    });
  }

  openType(type: TestTypeItem) {
    this.router.navigate(['/tabs/builder-tests', type.id]);
  }

  activeVersionLabel(type: TestTypeItem): string {
    const active = type.versions.find(v => v.isActive && !v.isDraft);
    return active ? `v${active.version} active` : 'no active version';
  }

  draftCount(type: TestTypeItem): number {
    return type.versions.filter(v => v.isDraft).length;
  }

  isAllDraft(type: TestTypeItem): boolean {
    return type.versions.every(v => v.isDraft);
  }

  async deleteType(type: TestTypeItem) {
    const draftVersions = type.versions.filter(v => v.isDraft).length;
    const detail = draftVersions > 0
      ? ` This will also delete ${draftVersions} draft version${draftVersions > 1 ? 's' : ''}.`
      : '';
    const a = await this.alert.create({
      header: 'Delete Test Type',
      message: `Delete "${type.name}"?${detail} This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete', role: 'destructive',
          handler: () => {
            this.service.deleteTestType(type.id).subscribe({
              next: () => { this.testTypes = this.testTypes.filter(t => t.id !== type.id); },
              error: () => this.showToast('Failed to delete test type', 'danger'),
            });
          },
        },
      ],
    });
    await a.present();
  }

  async promptNewType() {
    const a = await this.alert.create({
      header: 'New Test Type',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Name (e.g. Advanced)' },
        { name: 'description', type: 'text', placeholder: 'Description (optional)' },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Create',
          handler: async (data) => {
            if (!data.name?.trim()) return false;
            this.service.createTestType(data.name.trim(), data.description?.trim() || null).subscribe({
              next: res => this.router.navigate(['/tabs/builder-tests', res.testTypeId, res.configurationId]),
              error: () => this.showToast('Failed to create test type', 'danger'),
            });
            return true;
          },
        },
      ],
    });
    await a.present();
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
