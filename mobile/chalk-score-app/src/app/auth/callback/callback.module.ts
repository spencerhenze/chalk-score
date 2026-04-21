import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { CallbackPage } from './callback.page';

const routes: Routes = [{ path: '', component: CallbackPage }];

@NgModule({
  declarations: [CallbackPage],
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
})
export class CallbackPageModule {}
