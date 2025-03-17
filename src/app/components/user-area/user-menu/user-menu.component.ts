import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { NotifyService } from '../../../services/notify.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserStore } from '../../../../storage/user-store';

@Component({
  selector: 'app-user-menu',
  imports: [CommonModule, RouterModule],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css'
})
export class UserMenuComponent {
    private userStore = inject(UserStore);
    private userService = inject(UserService);
    private router = inject(Router);
    
    public dropdownOpen = false;
    
    get isLoggedIn(): boolean {
      return this.userStore.isLoggedIn();
    }
    
    get userName(): string {
      return this.userStore.userName() || this.userStore.userName() || 'User';
    }
    
    toggleDropdown(): void {
      this.dropdownOpen = !this.dropdownOpen;
    }
    
    logout(): void {
      this.userService.logout();
      this.dropdownOpen = false;
      this.router.navigate(['/login']);
    }
  }
