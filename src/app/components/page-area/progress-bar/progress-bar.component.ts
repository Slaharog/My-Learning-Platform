import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    
  `,
  styles: [`
    
  `]
})
export class ProgressBarComponent {
  @Input() percentage: number = 0;
  @Input() showCompleted: boolean = false;
  @Input() completedCount: number | null = null;
  @Input() totalCount: number | null = null;
  @Input() itemLabel: string = 'items';
  @Input() color: 'primary' | 'success' | 'info' | 'warning' | 'danger' = 'primary';
  
  get progressClass(): string {
    if (this.percentage < 25) {
      return 'progress-danger';
    } else if (this.percentage < 50) {
      return 'progress-warning';
    } else if (this.percentage < 75) {
      return 'progress-info';
    } else if (this.percentage < 100) {
      return 'progress-success';
    } else {
      return 'progress-primary';
    }
  }
}