import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { AdminPage } from './admin.page';

const routes: Routes = [{ path: '', component: AdminPage }];

@NgModule({
  declarations: [AdminPage],
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
})
export class AdminPageModule {}
