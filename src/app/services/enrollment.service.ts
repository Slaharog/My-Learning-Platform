import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NotifyService } from './notify.service';
import { AuthService } from './auth.service';
import { EnrollmentModel } from '../models/enrollment.model';
import { environment } from '../../environments/environment';
import { UserStore } from '../../storage/user-store';
import { Router } from '@angular/router';
import { ProgressService } from './progress.service';
import { LessonService } from './lesson.service';

@Injectable({
    providedIn: 'root'
})
export class EnrollmentService {
    private http = inject(HttpClient);
    private notifyService = inject(NotifyService);
    private authService = inject(AuthService);
    private userStore = inject(UserStore);
    private progressService = inject(ProgressService);
    private lessonService = inject(LessonService);
    private router = inject(Router);

    async enrollStudentInCourse(courseId: string): Promise<EnrollmentModel | null> {
        try {
            if (!this.authService.isAuthenticated()) {
                this.notifyService.error('Please log in to enroll in courses');
                this.router.navigate(['/login']);
                return null;
            }
            
            const userId = this.authService.getCurrentUserId();
            if (!userId) {
                throw new Error('User ID not available. Please log in again.');
            }
            
            // Check for existing enrollment first
            const enrollments = await this.getUserEnrollments();
            const existingEnrollment = enrollments.find(e => e.courseId === courseId);
            
            if (existingEnrollment) {
                console.log('User already enrolled in this course');
                this.notifyService.error('You are already enrolled in this course');
                return existingEnrollment;
            }
            
            // Use the correct API endpoint - adjust based on your backend
            const url = `${environment.apiUrl}enrollments/${courseId}`;
            
            // Create enrollment object
            const enrollmentData = {
                userId: userId,
                courseId: courseId,
                enrolledAt: new Date().toISOString()
            };
            
            console.log('Sending enrollment data:', enrollmentData);
            
            const enrollment$ = this.http.post<EnrollmentModel>(url, enrollmentData);
            const enrolled = await firstValueFrom(enrollment$);
            
            // Update local state
            this.userStore.addEnrollment(enrolled);
            
            // Build lesson-course mapping for progress tracking
            await this.progressService.buildLessonCourseMapping(courseId);
            
            // Refresh progress data after enrollment
            await this.refreshUserData();
            
            this.notifyService.success('Successfully enrolled in the course');
            
            return enrolled;
        } catch (error: any) {
            console.error('Error during enrollment:', error);
            
            if (error.error && typeof error.error === 'string') {
                this.notifyService.error('Server error: ' + error.error);
            } else if (error.error && Array.isArray(error.error)) {
                // Handle validation errors array
                this.notifyService.error('Validation error: ' + error.error.join(', '));
            } else {
                this.notifyService.error('Failed to enroll in the course. Please try again later.');
            }
            
            return null;
        }
    }

    async unenrollFromCourse(courseId: string): Promise<boolean> {
        try {
            const userId = this.authService.getCurrentUserId();

            if (!userId) {
                throw new Error('User ID not available. Please log in again.');
            }

            // Find the enrollment for this course
            const enrollments = this.userStore.enrollments();
            const enrollment = enrollments.find(e => e.courseId === courseId);

            if (!enrollment) {
                throw new Error('Enrollment not found');
            }

            // Delete the enrollment from the backend
            const url = `${environment.apiUrl}enrollments/${enrollment.enrollmentId}`;
            await firstValueFrom(this.http.delete(url));

            // Update lesson-course mapping before deleting
            await this.progressService.buildLessonCourseMapping(courseId);

            // Remove from user store
            this.userStore.removeEnrollment(enrollment.enrollmentId);
            
            // Clear progress data for this course from UserStore
            // Note: We don't delete progress from the database as it might be needed if user re-enrolls
            this.userStore.clearCourseProgress(courseId);
            
            // Refresh all user data to ensure everything is in sync
            await this.refreshUserData();
            
            this.notifyService.success('Successfully unenrolled from the course');
            return true;
        } catch (error: any) {
            console.error('Error during unenrollment:', error);
            this.notifyService.error(error.message || 'Failed to unenroll from the course');
            return false;
        }
    }

    async getUserEnrollments(): Promise<EnrollmentModel[]> {
        try {
            if (!this.authService.isAuthenticated()) {
                return [];
            }
      
            const userId = this.authService.getCurrentUserId();
            if (!userId) {
                return [];
            }
      
            // Always get fresh data from the API for the current user's enrollments
            const url = `${environment.apiUrl}users/enrollments/${userId}`;
            console.log('Fetching user enrollments from:', url);
            
            const enrollments$ = this.http.get<EnrollmentModel[]>(url);
            const enrollments = await firstValueFrom(enrollments$);
            
            console.log('Retrieved enrollments:', enrollments);
            
            // Update the store with fresh data
            this.userStore.setEnrollments(enrollments);
            
            // Update lesson-course mappings for all enrolled courses
            for (const enrollment of enrollments) {
                await this.progressService.buildLessonCourseMapping(enrollment.courseId);
            }
            
            return enrollments;
        } catch (error) {
            console.error('Error getting user enrollments:', error);
            
            // Fallback to store if API call fails
            return this.userStore.enrollments();
        }
    }
    
    // Helper method to check if user is enrolled in a course
    async isEnrolledInCourse(courseId: string): Promise<boolean> {
        const enrollments = await this.getUserEnrollments();
        return enrollments.some(e => e.courseId === courseId);
    }
    
    // Helper method to refresh all user data after enrollment changes
    private async refreshUserData(): Promise<void> {
        try {
            // Refresh enrollments
            const enrollments = await this.getUserEnrollments();
            
            // Refresh progress data if the user has any enrollments
            if (enrollments.length > 0) {
                const userId = this.authService.getCurrentUserId();
                if (userId) {
                    // This will update the progress in UserStore
                    await this.progressService.refreshUserProgress(userId);
                }
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    }
}