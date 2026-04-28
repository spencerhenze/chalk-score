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
  levels = [
    { name: 'Level 1',  value: '1' },
    { name: 'Level 2',  value: '2' },
    { name: 'Level 3',  value: '3' },
    { name: 'Level 4',  value: '4' },
    { name: 'Level 5',  value: '5' },
    { name: 'Level 6',  value: '6' },
    { name: 'Level 7',  value: '7' },
    { name: 'Level 8',  value: '8' },
    { name: 'Level 9',  value: '9' },
    { name: 'Level 10', value: '10' },
    { name: 'Bronze',   value: 'Bronze' },
    { name: 'Silver',   value: 'Silver' },
    { name: 'Gold',     value: 'Gold' },
    { name: 'Platinum', value: 'Platinum' },
    { name: 'Diamond',  value: 'Diamond' },
  ];

  get isEdit() { return !!this.gymnast; }

  constructor(private fb: FormBuilder, private modalCtrl: ModalController) {}

  ngOnInit() {
    this.form = this.fb.group({
      firstName: [this.gymnast?.firstName ?? '', [Validators.required, Validators.maxLength(50)]],
      lastName:  [this.gymnast?.lastName  ?? '', [Validators.required, Validators.maxLength(50)]],
      level:     [this.gymnast?.level     ?? null, Validators.required],
    });
  }

  save() {
    if (this.form.invalid) return;
    this.modalCtrl.dismiss(this.form.value, 'save');
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
