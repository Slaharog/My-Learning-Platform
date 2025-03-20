import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserMenuComponent } from "../../user-area/user-menu/user-menu.component";
import { UserStore } from '../../../../storage/user-store';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, UserMenuComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private userStore = inject(UserStore);
  private authService = inject(AuthService);
  
  menuOpen = false;

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
  
  // Close mobile menu when a link is clicked
  closeMenu() {
    this.menuOpen = false;
  }
}