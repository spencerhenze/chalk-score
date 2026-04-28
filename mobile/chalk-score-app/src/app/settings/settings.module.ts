import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SettingsPageRoutingModule } from './settings-routing.module';
import { SettingsPage } from './settings.page';

@NgModule({
  declarations: [SettingsPage],
  imports: [CommonModule, IonicModule, SettingsPageRoutingModule],
})
export class SettingsPageModule {}
