import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserStore } from '../../../../storage/user-store';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css'
})
export class UserMenuComponent implements OnInit {
  private userStore = inject(UserStore);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  public dropdownOpen = false;
  
  ngOnInit(): void {
    // Initialize user data if needed
  }
  
  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }
  
  get userName(): string {
    return this.userStore.userName() || 'User';
  }
  
  get userInitials(): string {
    const name = this.userName;
    if (!name || name === 'User') return 'U';
    
    // Get first letter of first name and last name if available
    const parts = name.split(' ');
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  
  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }
  
  closeDropdown(): void {
    this.dropdownOpen = false;
  }
  
  logout(): void {
    this.userService.logout();
    this.closeDropdown();
    this.router.navigate(['/login']);
  }
  
  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userMenuEl = document.querySelector('.user-menu-container') as HTMLElement;
    
    if (userMenuEl && !userMenuEl.contains(target)) {
      this.closeDropdown();
    }
  }
}