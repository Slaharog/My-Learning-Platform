import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-page404',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './page404.component.html',
  styleUrl: './page404.component.css'
})
export class Page404Component {
  
  constructor(
    private router: Router,
    private location: Location
  ) {}
  
  /**
   * Navigate back to the previous page in history
   */
  goBack(): void {
    this.location.back();
  }
  
  /**
   * Navigate to the home page
   */
  goHome(): void {
    this.router.navigate(['/home']);
  }
}