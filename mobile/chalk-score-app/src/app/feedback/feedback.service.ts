import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import { SubmitFeedbackRequest } from './feedback.model';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(private api: ApiService) {}

  submit(request: SubmitFeedbackRequest): Observable<void> {
    return this.api.post<void>('feedback', request);
  }
}
