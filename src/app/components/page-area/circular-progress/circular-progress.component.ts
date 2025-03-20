// circular-progress.component.ts
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-circular-progress',
  standalone: true,
  imports: [CommonModule],
  template: ``,
  styles: []
})
export class CircularProgressComponent implements OnChanges {
  @Input() percentage: number = 0;
  
  circumference = 2 * Math.PI * 15.5;
  dashOffset = 0;

  ngOnChanges() {
    this.dashOffset = this.circumference - (this.percentage / 100) * this.circumference;
  }
}