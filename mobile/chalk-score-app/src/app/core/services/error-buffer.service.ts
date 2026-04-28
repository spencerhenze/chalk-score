import { Injectable } from '@angular/core';

const MAX_ERRORS = 20;

@Injectable({ providedIn: 'root' })
export class ErrorBufferService {
  private errors: string[] = [];

  constructor() {
    const original = console.error.bind(console);
    console.error = (...args: any[]) => {
      original(...args);
      const msg = args
        .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ');
      this.errors.push(`[${new Date().toISOString()}] ${msg}`);
      if (this.errors.length > MAX_ERRORS) this.errors.shift();
    };
  }

  drain(): string | null {
    if (this.errors.length === 0) return null;
    const snapshot = this.errors.join('\n');
    this.errors = [];
    return snapshot;
  }
}
