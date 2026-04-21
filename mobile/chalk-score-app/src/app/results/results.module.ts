import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { ResultsPage } from './results.page';
import { CompletedCountPipe } from './completed-count.pipe';

const routes: Routes = [{ path: '', component: ResultsPage }];

@NgModule({
  declarations: [ResultsPage, CompletedCountPipe],
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
})
export class ResultsPageModule {}
