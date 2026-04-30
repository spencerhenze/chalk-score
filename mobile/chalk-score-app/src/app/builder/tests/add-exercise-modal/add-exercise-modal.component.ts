import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ExercisesBuilderService } from '../../exercises/exercises-builder.service';
import { ExerciseItem } from '../../exercises/exercises-builder.model';

@Component({
  selector: 'app-add-exercise-modal',
  templateUrl: './add-exercise-modal.component.html',
  standalone: false,
})
export class AddExerciseModalComponent implements OnInit {
  @Input() excludeIds: string[] = [];

  exercises: ExerciseItem[] = [];
  filtered: ExerciseItem[] = [];
  searchTerm = '';
  loading = false;

  constructor(
    private modalCtrl: ModalController,
    private exercisesService: ExercisesBuilderService,
  ) {}

  ngOnInit() {
    this.loading = true;
    this.exercisesService.getAll().subscribe({
      next: exercises => {
        this.exercises = exercises.filter(e => e.isActive && !this.excludeIds.includes(e.id));
        this.filtered  = this.exercises;
        this.loading   = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch(event: CustomEvent) {
    const term = (event.detail.value ?? '').toLowerCase();
    this.filtered = this.exercises.filter(e =>
      e.name.toLowerCase().includes(term) || e.unit.toLowerCase().includes(term)
    );
  }

  select(exercise: ExerciseItem) {
    this.modalCtrl.dismiss(exercise, 'selected');
  }

  cancel() { this.modalCtrl.dismiss(null, 'cancel'); }
}
