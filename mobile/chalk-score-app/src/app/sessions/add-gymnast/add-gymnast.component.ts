import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { forkJoin } from 'rxjs';
import { GymnastsService } from '../../gymnasts/gymnasts.service';
import { SessionsService } from '../sessions.service';
import { Gymnast } from '../../gymnasts/gymnast.model';
import { TestConfigurationSummary, TestSessionGymnast } from '../session.model';

@Component({
  selector: 'app-add-gymnast',
  templateUrl: './add-gymnast.component.html',
  standalone: false,
})
export class AddGymnastComponent implements OnInit {
  @Input() sessionId!: string;
  @Input() alreadyAdded: string[] = [];

  form!: FormGroup;
  gymnasts: Gymnast[] = [];
  configurations: TestConfigurationSummary[] = [];
  loading = true;

  constructor(
    private fb: FormBuilder,
    private modal: ModalController,
    private gymnastsService: GymnastsService,
    private sessionsService: SessionsService,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      gymnastId:           ['', Validators.required],
      testConfigurationId: ['', Validators.required],
    });

    forkJoin({
      gymnasts: this.gymnastsService.getAll(),
      configs:  this.sessionsService.getConfigurations(),
    }).subscribe(({ gymnasts, configs }) => {
      this.gymnasts       = gymnasts.filter(g => !this.alreadyAdded.includes(g.id));
      this.configurations = configs;
      this.loading        = false;
    });
  }

  save() {
    if (this.form.invalid) return;
    this.modal.dismiss(this.form.value, 'save');
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }
}
