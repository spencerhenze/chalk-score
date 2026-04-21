import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-session-form',
  templateUrl: './session-form.component.html',
  standalone: false,
})
export class SessionFormComponent implements OnInit {
  form!: FormGroup;

  constructor(private fb: FormBuilder, private modal: ModalController) {}

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      date: [today, Validators.required],
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
