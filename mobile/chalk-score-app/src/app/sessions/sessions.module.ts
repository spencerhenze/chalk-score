import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { SessionsPage } from './sessions.page';
import { SessionDetailPage } from './session-detail/session-detail.page';
import { SessionFormComponent } from './session-form/session-form.component';
import { AddGymnastComponent } from './add-gymnast/add-gymnast.component';
import { TestEntryPage } from './test-entry/test-entry.page';

const routes: Routes = [
  { path: '', component: SessionsPage },
  { path: ':id', component: SessionDetailPage },
  { path: ':sessionId/entry/:tsgId', component: TestEntryPage },
];

@NgModule({
  declarations: [
    SessionsPage,
    SessionDetailPage,
    SessionFormComponent,
    AddGymnastComponent,
    TestEntryPage,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
})
export class SessionsPageModule {}
