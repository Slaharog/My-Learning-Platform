import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserModel } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl + '/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_ID_KEY = 'user_id';
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private currentUserSubject = new BehaviorSubject<UserModel>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialize authentication state on service creation
    this.checkAuthStatus();
  }

  /**
   * Register a new user
   */
  public register(user: Partial<UserModel>): Observable<{ token: string, user: UserModel }> {
    return this.http.post<{ token: string, user: UserModel }>(`${this.API_URL}/register`, user)
      .pipe(
        tap(response => this.handleAuthentication(response.token, response.user))
      );
  }

  /**
   * Log in an existing user
   */
  public login(email: string, password: string): Observable<{ token: string, user: UserModel }> {
    return this.http.post<{ token: string, user: UserModel }>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => this.handleAuthentication(response.token, response.user))
      );
  }

  /**
   * Log out the current user
   */
  public logout(): void {
    // Remove token and user from storage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    
    // Update authentication state
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    
    // Navigate to login page
    this.router.navigateByUrl('/login');
  }

  /**
   * Check if the user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get the current user ID
   */
  public getCurrentUserId(): string {
    return localStorage.getItem(this.USER_ID_KEY);
  }

  /**
   * Get the current user object
   */
  public getCurrentUser(): UserModel {
    return this.currentUserSubject.value;
  }

  /**
   * Get the authentication token
   */
  public getToken(): string {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Request a password reset
   */
  public requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/forgot-password`, { email });
  }

  /**
   * Reset password with token
   */
  public resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/reset-password`, { 
      token, 
      password: newPassword 
    });
  }

  /**
   * Change password (when logged in)
   */
  public changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/change-password`, {
      currentPassword,
      newPassword
    });
  }

  /**
   * Verify email address
   */
  public verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/verify-email`, { token });
  }

  /**
   * Refresh the user's authentication token
   */
  public refreshToken(): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.API_URL}/refresh-token`, {})
      .pipe(
        tap(response => {
          localStorage.setItem(this.TOKEN_KEY, response.token);
        })
      );
  }

  /**
   * Check if the current authentication token exists
   */
  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check authentication status and load user data if authenticated
   */
  private async checkAuthStatus(): Promise<void> {
    if (this.hasToken()) {
      try {
        // Validate token and get user data
        const response = await this.http.get<UserModel>(`${this.API_URL}/me`).toPromise();
        this.currentUserSubject.next(response);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        // If token validation fails, log out
        this.logout();
      }
    }
  }

  /**
   * Handle the authentication response
   */
  private handleAuthentication(token: string, user: UserModel): void {
    // Store token and user ID
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_ID_KEY, user.id);
    
    // Update authentication state
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }
}