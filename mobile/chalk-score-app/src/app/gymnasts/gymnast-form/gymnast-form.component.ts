import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Gymnast } from '../gymnast.model';

@Component({
  selector: 'app-gymnast-form',
  templateUrl: './gymnast-form.component.html',
  standalone: false,
})
export class GymnastFormComponent implements OnInit {
  @Input() gymnast?: Gymnast;

  form!: FormGroup;
  levels = Array.from({ length: 10 }, (_, i) => i + 1);

  get isEdit() { return !!this.gymnast; }

  constructor(private fb: FormBuilder, private modal: ModalController) {}

  ngOnInit() {
    this.form = this.fb.group({
      firstName: [this.gymnast?.firstName ?? '', [Validators.required, Validators.maxLength(50)]],
      lastName:  [this.gymnast?.lastName  ?? '', [Validators.required, Validators.maxLength(50)]],
      level:     [this.gymnast?.level     ?? 1,  [Validators.required, Validators.min(1), Validators.max(10)]],
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
