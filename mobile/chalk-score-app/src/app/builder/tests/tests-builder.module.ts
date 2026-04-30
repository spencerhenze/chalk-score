import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { TestsBuilderPage } from './tests-builder.page';
import { TestVersionsPage } from './test-versions/test-versions.page';
import { TestVersionDetailPage } from './test-version-detail/test-version-detail.page';
import { AddExerciseModalComponent } from './add-exercise-modal/add-exercise-modal.component';

const routes: Routes = [
  { path: '',                      component: TestsBuilderPage },
  { path: ':typeId',               component: TestVersionsPage },
  { path: ':typeId/:configId',     component: TestVersionDetailPage },
];

@NgModule({
  declarations: [
    TestsBuilderPage,
    TestVersionsPage,
    TestVersionDetailPage,
    AddExerciseModalComponent,
  ],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
})
export class TestsBuilderPageModule {}
