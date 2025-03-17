import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserModel } from '../models/user.model';
import { CredentialsModel } from '../models/credentials.model';
import { UserStore } from '../../storage/user-store';
import { ProgressModel } from '../models/progress.model';
import { EnrollmentModel } from '../models/enrollment.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private http = inject(HttpClient);
    private userStore = inject(UserStore);

    public constructor() {
        const token = localStorage.getItem("token");
        if (!token) return;
        const payload = jwtDecode<{ user: string }>(token);
        const dbUser = JSON.parse(payload.user);
        this.userStore.initUser(dbUser);
    }

    public async register(user: UserModel): Promise<void> {
        const response$ = this.http.post<{ token: string }>(environment.registerUrl, user);
        const response = await firstValueFrom(response$);
        const token = response.token;
        const payload = jwtDecode<{ user: string }>(token);
        const dbUser = JSON.parse(payload.user);
        this.userStore.initUser(dbUser);
        localStorage.setItem("token", token);
    }

    public async login(credentials: CredentialsModel): Promise<void> {
        const response$ = this.http.post<{ token: string }>(environment.loginUrl, credentials);
        const response = await firstValueFrom(response$);
        const token = response.token;
        const payload = jwtDecode<{ user: string }>(token);
        const dbUser = JSON.parse(payload.user);
        localStorage.setItem("token", token);
        this.userStore.initUser(dbUser);
    }

    public logout(): void {
        this.userStore.logoutUser();
        localStorage.removeItem("token");
    }

    public async getMyUser(): Promise<UserModel> {
        const course = this.userStore.getMyUser();
        if (course) return course;
        const course$ = this.http.get<UserModel>(environment.userUrl);
        const dbCourse = await firstValueFrom(course$);
        return dbCourse;
    }

    public async updateUserProfile(user: UserModel): Promise<UserModel> {
        const updatedUser$ = this.http.put<UserModel>(`${environment.userUrl}/${user.id}`, user);
        const updatedUser = await firstValueFrom(updatedUser$);
        
        // Update user in store
        this.userStore.updateUser(updatedUser);
        
        return updatedUser;
    }
    
    // Load user enrollments
    private async loadUserEnrollments(): Promise<void> {
        try {
            const enrollments$ = this.http.get<EnrollmentModel[]>(`${environment.userUrl}/enrollments`);
            const enrollments = await firstValueFrom(enrollments$);
            this.userStore.setEnrollments(enrollments);
        } catch (error) {
            console.error('Error loading enrollments:', error);
        }
    }
    
    // Load user progress
    private async loadUserProgress(): Promise<void> {
        try {
            const progress$ = this.http.get<ProgressModel[]>(`${environment.userUrl}/progress`);
            const progress = await firstValueFrom(progress$);
            this.userStore.setProgress(progress);
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    }
    
    // Get user enrollments
    public async getEnrollments(): Promise<EnrollmentModel[]> {
        const enrollments = this.userStore.enrollments();
        if (enrollments.length > 0) return enrollments;
        
        await this.loadUserEnrollments();
        return this.userStore.enrollments();
    }
    
    // Get user progress
    public async getProgress(): Promise<ProgressModel[]> {
        const progress = this.userStore.progress();
        if (progress.length > 0) return progress;
        
        await this.loadUserProgress();
        return this.userStore.progress();
    }
    
    // Enroll in a course
    public async enrollInCourse(courseId: string): Promise<void> {
        const enrollment$ = this.http.post<EnrollmentModel>(`${environment.userUrl}/enrollments/`, { courseId });
        const enrollment = await firstValueFrom(enrollment$);
        this.userStore.addEnrollment(enrollment);
    }
    
    // Mark lesson as completed
    public async markLessonCompleted(lessonId: string): Promise<void> {
        const progress$ = this.http.post<ProgressModel>(`${environment.userUrl}/progress/`, { lessonId });
        const progress = await firstValueFrom(progress$);
        this.userStore.addProgress(progress);
    }

}
