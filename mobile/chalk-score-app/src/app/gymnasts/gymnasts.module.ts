import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { GymnastsPage } from './gymnasts.page';
import { GymnastFormComponent } from './gymnast-form/gymnast-form.component';

const routes: Routes = [{ path: '', component: GymnastsPage }];

@NgModule({
  declarations: [GymnastsPage, GymnastFormComponent],
  imports: [CommonModule, ReactiveFormsModule, IonicModule, RouterModule.forChild(routes)],
})
export class GymnastsPageModule {}
