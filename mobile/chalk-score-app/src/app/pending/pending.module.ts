import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { PendingPage } from './pending.page';

const routes: Routes = [{ path: '', component: PendingPage }];

@NgModule({
  declarations: [PendingPage],
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
})
export class PendingPageModule {}
