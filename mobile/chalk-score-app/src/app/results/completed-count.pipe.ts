import { Pipe, PipeTransform } from '@angular/core';
import { SessionGymnastResult } from './results.service';

@Pipe({ name: 'completedCount', standalone: false })
export class CompletedCountPipe implements PipeTransform {
  transform(results: SessionGymnastResult[]): number {
    return results.filter(r => r.isCompleted).length;
  }
}
