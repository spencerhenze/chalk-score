import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'gymnasts',
        loadChildren: () => import('../gymnasts/gymnasts.module').then(m => m.GymnastsPageModule),
      },
      {
        path: 'sessions',
        loadChildren: () => import('../sessions/sessions.module').then(m => m.SessionsPageModule),
      },
      {
        path: 'results',
        loadChildren: () => import('../results/results.module').then(m => m.ResultsPageModule),
      },
      {
        path: 'profile',
        loadChildren: () => import('../profile/profile.module').then(m => m.ProfilePageModule),
      },
      {
        path: 'admin',
        loadChildren: () => import('../admin/admin.module').then(m => m.AdminPageModule),
      },
      {
        path: 'settings',
        loadChildren: () => import('../settings/settings.module').then(m => m.SettingsPageModule),
      },
      {
        path: 'builder-exercises',
        loadChildren: () => import('../builder/exercises/exercises-builder.module').then(m => m.ExercisesBuilderPageModule),
      },
      {
        path: 'builder-tests',
        loadChildren: () => import('../builder/tests/tests-builder.module').then(m => m.TestsBuilderPageModule),
      },
      {
        path: '',
        redirectTo: '/tabs/gymnasts',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
