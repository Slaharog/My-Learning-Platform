import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    
  `,
  styles: [`
    
  `]
})
export class StatusBadgeComponent {
  @Input() status: 'completed' | 'in-progress' | 'not-started' | 'error' | 'warning' = 'not-started';
  @Input() showIcon: boolean = true;
  
  get statusClass(): string {
    return `status-${this.status}`;
  }
}