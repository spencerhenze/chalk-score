import { Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonInput, ModalController } from '@ionic/angular';
import { Keyboard } from '@capacitor/keyboard';
import { Gymnast } from '../gymnast.model';

@Component({
  selector: 'app-gymnast-form',
  templateUrl: './gymnast-form.component.html',
  standalone: false,
})
export class GymnastFormComponent implements OnInit {
  @ViewChildren(IonInput) inputs!: QueryList<IonInput>;
  @Input() gymnast?: Gymnast;

  focusedIndex = -1;
  private blurTimer: ReturnType<typeof setTimeout> | null = null;

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

  onFocus(index: number) {
    if (this.blurTimer) clearTimeout(this.blurTimer);
    this.focusedIndex = index;
  }

  onBlur() {
    this.blurTimer = setTimeout(() => { this.focusedIndex = -1; }, 150);
  }

  focusPrev() {
    this.inputs.toArray()[this.focusedIndex - 1]?.setFocus();
  }

  focusNext() {
    this.inputs.toArray()[this.focusedIndex + 1]?.setFocus();
  }

  async dismissKeyboard() {
    await Keyboard.hide();
    this.focusedIndex = -1;
  }

  save() {
    if (this.form.invalid) return;
    this.modalCtrl.dismiss(this.form.value, 'save');
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
