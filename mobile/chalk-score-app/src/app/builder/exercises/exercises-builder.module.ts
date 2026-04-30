import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { ExercisesBuilderPage } from './exercises-builder.page';
import { ExerciseEditModalComponent } from './exercise-edit-modal.component';

const routes: Routes = [
  { path: '', component: ExercisesBuilderPage },
];

@NgModule({
  declarations: [ExercisesBuilderPage, ExerciseEditModalComponent],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
})
export class ExercisesBuilderPageModule {}
