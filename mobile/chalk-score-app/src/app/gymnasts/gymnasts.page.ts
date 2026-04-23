import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { GymnastsService } from './gymnasts.service';
import { Gymnast } from './gymnast.model';
import { GymnastFormComponent } from './gymnast-form/gymnast-form.component';

@Component({
  selector: 'app-gymnasts',
  templateUrl: './gymnasts.page.html',
  standalone: false,
})
export class GymnastsPage implements OnInit {
  @ViewChild('csvInput') csvInput!: ElementRef<HTMLInputElement>;

  gymnasts: Gymnast[] = [];
  filtered: Gymnast[] = [];
  loading = false;
  importing = false;
  searchTerm = '';

  constructor(
    private service: GymnastsService,
    private modal: ModalController,
    private alert: AlertController,
    private toast: ToastController,
  ) {}

  ngOnInit() {
    this.load();
  }

  ionViewWillEnter() {
    this.load();
  }

  async load() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: data => {
        this.gymnasts = data;
        this.applySearch();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to load gymnasts', 'danger');
      },
    });
  }

  onSearch(event: CustomEvent) {
    this.searchTerm = (event.detail.value ?? '').toLowerCase();
    this.applySearch();
  }

  applySearch() {
    if (!this.searchTerm) {
      this.filtered = this.gymnasts;
      return;
    }
    this.filtered = this.gymnasts.filter(g =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(this.searchTerm)
    );
  }

  async openAdd() {
    const m = await this.modal.create({ component: GymnastFormComponent });
    await m.present();
    const { data, role } = await m.onWillDismiss();
    if (role !== 'save') return;
    this.service.create(data).subscribe({
      next: () => { this.load(); this.showToast('Gymnast added'); },
      error: () => this.showToast('Failed to add gymnast', 'danger'),
    });
  }

  async openEdit(gymnast: Gymnast) {
    const m = await this.modal.create({
      component: GymnastFormComponent,
      componentProps: { gymnast },
    });
    await m.present();
    const { data, role } = await m.onWillDismiss();
    if (role !== 'save') return;
    this.service.update(gymnast.id, { ...data, imageUrl: gymnast.imageUrl ?? null }).subscribe({
      next: () => { this.load(); this.showToast('Gymnast updated'); },
      error: () => this.showToast('Failed to update gymnast', 'danger'),
    });
  }

  async confirmDelete(gymnast: Gymnast) {
    const a = await this.alert.create({
      header: 'Delete Gymnast',
      message: `Remove ${gymnast.firstName} ${gymnast.lastName} from the roster?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.service.delete(gymnast.id).subscribe({
              next: () => { this.load(); this.showToast('Gymnast removed'); },
              error: () => this.showToast('Failed to delete gymnast', 'danger'),
            });
          },
        },
      ],
    });
    await a.present();
  }

  triggerImport() {
    this.csvInput.nativeElement.value = '';
    this.csvInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.importing = true;
    this.service.importCsv(file).subscribe({
      next: async result => {
        this.importing = false;
        this.load();

        if (result.errors.length > 0) {
          const errorLines = result.errors.map(e => `Row ${e.row}: ${e.reason}`).join('<br>');
          const a = await this.alert.create({
            header: 'Import Complete',
            message: `${result.imported} imported, ${result.skipped} skipped.<br><br><strong>Row errors:</strong><br>${errorLines}`,
            buttons: ['OK'],
          });
          await a.present();
        } else {
          const parts = [`${result.imported} gymnast${result.imported !== 1 ? 's' : ''} imported`];
          if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
          this.showToast(parts.join(', '));
        }
      },
      error: () => {
        this.importing = false;
        this.showToast('Failed to import CSV', 'danger');
      },
    });
  }

  private async showToast(message: string, color = 'success') {
    const t = await this.toast.create({ message, duration: 2000, color, position: 'bottom' });
    await t.present();
  }
}
