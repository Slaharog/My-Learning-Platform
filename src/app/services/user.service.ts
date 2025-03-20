import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserModel } from '../models/user.model';
import { CredentialsModel } from '../models/credentials.model';
import { UserStore } from '../../storage/user-store';
import { ProgressModel } from '../models/progress.model';
import { EnrollmentModel } from '../models/enrollment.model';
import { NotifyService } from './notify.service';
import { AuthService } from './auth.service';
import { EnrollmentService } from './enrollment.service';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private userStore = inject(UserStore);
    private notifyService = inject(NotifyService);
    private authService = inject(AuthService);
    private router = inject(Router);

    public constructor() {
        // Initialize user from token if available
        this.initializeFromToken();
    }

    /**
     * Initialize user data from JWT token if available
     */
    private initializeFromToken(): void {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        try {
            const payload = jwtDecode<{ user: string }>(token);
            const dbUser = JSON.parse(payload.user);
            this.userStore.initUser(dbUser);
        } catch (error) {
            console.error('Error initializing user from token:', error);
        }
    }

    /**
     * Register a new user
     */
    public async register(user: UserModel): Promise<void> {
        try {
            const response$ = this.http.post<{ token: string }>(environment.registerUrl, user);
            const response = await firstValueFrom(response$);
            const token = response.token;
            
            // Save token to localStorage
            localStorage.setItem("token", token);
            
            // Decode user from token and update store
            const payload = jwtDecode<{ user: string }>(token);
            const dbUser = JSON.parse(payload.user);
            this.userStore.initUser(dbUser);
            
            this.notifyService.success(`Welcome ${dbUser.name}! Your account has been created.`);
        } catch (error) {
            console.error('Registration error:', error);
            this.notifyService.error('Registration failed. Please check your details and try again.');
            throw error;
        }
    }

    /**
     * Login an existing user
     */
    public async login(credentials: CredentialsModel): Promise<void> {
        try {
            const response$ = this.http.post<{ token: string }>(environment.loginUrl, credentials);
            const response = await firstValueFrom(response$);
            const token = response.token;
            
            // Save token to localStorage
            localStorage.setItem("token", token);
            
            // Decode user from token and update store
            const payload = jwtDecode<{ user: string }>(token);
            const dbUser = JSON.parse(payload.user);
            this.userStore.initUser(dbUser);
            
            this.notifyService.success(`Welcome back, ${dbUser.name}!`);
        } catch (error) {
            console.error('Login error:', error);
            this.notifyService.error('Login failed. Please check your credentials and try again.');
            throw error;
        }
    }

    /**
     * Logout the current user
     */
    public logout(): void {
        // Clear user data from store
        this.userStore.logoutUser();
        
        // Clear local storage
        localStorage.removeItem("token");
        
        this.notifyService.success('You have been logged out successfully');
        this.router.navigate(['/login']);
    }

    /**
     * Get the current user from store or API
     */
    public async getMyUser(): Promise<UserModel> {
        // Check store first
        const user = this.userStore.getMyUser();
        if (user) return user;
        
        try {
            // Fallback to API
            const user$ = this.http.get<UserModel>(environment.userUrl);
            const dbUser = await firstValueFrom(user$);
            
            // Update store
            this.userStore.initUser(dbUser);
            
            return dbUser;
        } catch (error) {
            console.error('Error fetching user data:', error);
            this.notifyService.error('Failed to load user data');
            throw error;
        }
    }

    /**
     * Update user profile
     */
    public async updateUserProfile(user: UserModel): Promise<UserModel> {
        try {
            const updatedUser$ = this.http.put<UserModel>(`${environment.userUrl}${user.id}`, user);
            const updatedUser = await firstValueFrom(updatedUser$);

            // Update user in store
            this.userStore.updateUser(updatedUser);
            this.notifyService.success('Profile updated successfully');

            return updatedUser;
        } catch (error) {
            console.error('Error updating user profile:', error);
            this.notifyService.error('Failed to update profile');
            throw error;
        }
    }

    /**
     * Enroll current user in a course
     */
    public async enrollInCourse(courseId: string): Promise<void> {
        try {
            // Check if user is authenticated
            if (!this.authService.isAuthenticated()) {
                this.notifyService.error('Please log in to enroll in courses');
                this.router.navigateByUrl("/login");
                return;
            }

            const userId = this.authService.getCurrentUserId();
            if (!userId) {
                this.notifyService.error('User ID is missing. Please log in again.');
                return;
            }

            // Check if already enrolled using store data
            const enrollments = this.userStore.enrollments();
            if (enrollments.some(e => e.courseId === courseId)) {
                this.notifyService.error('You are already enrolled in this course');
                return;
            }

            // Use correct API endpoint from EnrollmentController
            const url = `${environment.apiUrl}enrollments`;
            const enrollment$ = this.http.post<EnrollmentModel>(url, { userId, courseId });
            const enrollment = await firstValueFrom(enrollment$);
            
            // Update store
            this.userStore.addEnrollment(enrollment);
            
            this.notifyService.success('Successfully enrolled in course');
        } catch (error) {
            console.error('Failed to enroll in course:', error);
            this.notifyService.error('Failed to enroll in course');
            throw error;
        }
    }

    public async getProgress(): Promise<ProgressModel[]> {
        // Check store first
        const progress = this.userStore.progress();
        if (progress.length > 0) return progress;

        await this.loadUserProgress();
        return this.userStore.progress();
    }

    private async loadUserProgress(): Promise<void> {
        try {
            const userId = this.authService.getCurrentUserId();
            if (!userId) {
                console.error('User ID is missing when loading progress');
                return;
            }

            // The backend endpoint for user progress
            const progressUrl = `${environment.apiUrl}progresses/user/${userId}`;
            const progress$ = this.http.get<ProgressModel[]>(progressUrl);
            const progress = await firstValueFrom(progress$);
            
            // Update store
            this.userStore.setProgress(progress);
        } catch (error) {
            console.error('Error loading user progress:', error);
        }
    }

    public async markLessonCompleted(lessonId: string): Promise<void> {
        try {
            const userId = this.authService.getCurrentUserId();
            if (!userId) {
                this.notifyService.error('User ID is missing. Please log in again.');
                return;
            }
    
            // Log progress details
            console.log('Marking lesson as completed:', lessonId);
            console.log('User ID:', userId);
            
            // Check the endpoint from ProgressController.cs
            // [HttpPost("api/progresses/{id}")]
            const tempProgressId = '00000000-0000-0000-0000-000000000000';
            const progressUrl = `${environment.apiUrl}progresses/${tempProgressId}`;
            console.log('Progress API endpoint:', progressUrl);
            
            const progress = {
                progressId: tempProgressId,
                userId: userId,
                lessonId: lessonId,
                watchedAt: new Date()
            };
            console.log('Progress data:', JSON.stringify(progress));
            
            const progress$ = this.http.post<ProgressModel>(progressUrl, progress);
            const newProgress = await firstValueFrom(progress$);
            console.log('Progress response:', newProgress);
            
            this.userStore.addProgress(newProgress);
            this.notifyService.success('Lesson marked as completed!');
        } catch (error: any) {
            console.error('Error marking lesson as completed:', error);
            
            // More detailed error info
            if (error.status) {
                console.error(`Status: ${error.status}, Message: ${error.message}`);
                if (error.error) {
                    console.error('Error details:', error.error);
                }
            }
            
            this.notifyService.error('Failed to mark lesson as completed');
            throw error;
        }
    }
}