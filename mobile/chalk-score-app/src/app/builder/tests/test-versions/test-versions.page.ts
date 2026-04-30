import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { TestsBuilderService } from '../tests-builder.service';
import { TestTypeItem, VersionSummary } from '../tests-builder.model';
import { AdminModeService } from '../../../core/services/admin-mode.service';

@Component({
  selector: 'app-test-versions',
  templateUrl: './test-versions.page.html',
  standalone: false,
})
export class TestVersionsPage implements OnInit {
  typeId!: string;
  testType: TestTypeItem | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: TestsBuilderService,
    private toast: ToastController,
    private alert: AlertController,
    public adminMode: AdminModeService,
  ) {}

  ngOnInit() {
    this.typeId = this.route.snapshot.paramMap.get('typeId')!;
  }

  ionViewWillEnter() { this.load(); }

  load() {
    this.loading = true;
    this.service.getTestTypes().subscribe({
      next: types => {
        this.testType = types.find(t => t.id === this.typeId) ?? null;
        this.loading  = false;
      },
      error: () => { this.loading = false; this.showToast('Failed to load versions', 'danger'); },
    });
  }

  openVersion(v: VersionSummary) {
    this.router.navigate(['/tabs/builder-tests', this.typeId, v.id]);
  }

  versionLabel(v: VersionSummary): string {
    const parts = [`v${v.version}`];
    if (v.isDraft)   parts.push('draft');
    if (v.isActive)  parts.push('active');
    return parts.join(' · ');
  }

  badgeColor(v: VersionSummary): string {
    if (v.isDraft)  return 'warning';
    if (v.isActive) return 'success';
    return 'medium';
  }

  async newVersion() {
    if (!this.testType) return;
    const latestPublished = [...this.testType.versions]
      .filter(v => !v.isDraft)
      .sort((a, b) => b.version - a.version)[0];

    this.service.createVersion(this.typeId, latestPublished?.id).subscribe({
      next: res => this.router.navigate(['/tabs/builder-tests', this.typeId, res.id]),
      error: () => this.showToast('Failed to create version', 'danger'),
    });
  }

  async deleteVersion(v: VersionSummary) {
    const a = await this.alert.create({
      header: 'Delete Draft',
      message: `Delete v${v.version} draft? This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete', role: 'destructive',
          handler: () => {
            this.service.deleteVersion(v.id).subscribe({
              next: () => {
                this.testType!.versions = this.testType!.versions.filter(x => x.id !== v.id);
              },
              error: () => this.showToast('Failed to delete version', 'danger'),
            });
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
