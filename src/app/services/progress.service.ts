import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NotifyService } from './notify.service';
import { AuthService } from './auth.service';
import { ProgressModel } from '../models/progress.model';
import { environment } from '../../environments/environment';
import { LessonModel } from '../models/lesson.model';
import { UserStore } from '../../storage/user-store';
import { LessonService } from './lesson.service';

export interface CourseProgress {
    courseId: string;
    courseTitle: string;
    completedLessons: number;
    totalLessons: number;
    percentComplete: number;
    lessons: LessonProgress[];
}

export interface LessonProgress {
    lessonId: string;
    lessonTitle: string;
    completed: boolean;
    watchedAt?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class ProgressService {
    private http = inject(HttpClient);
    private notifyService = inject(NotifyService);
    private authService = inject(AuthService);
    private userStore = inject(UserStore);
    private lessonService = inject(LessonService);

    // Refresh all progress data for a user
    async refreshUserProgress(userId: string): Promise<ProgressModel[]> {
        try {
            const url = `${environment.apiUrl}progresses/user/${userId}`;
            console.log(`Fetching progress data for user ${userId}`);
            
            const progress$ = this.http.get<ProgressModel[]>(url);
            const progress = await firstValueFrom(progress$);
            
            console.log(`Retrieved ${progress.length} progress records`);
            
            // Update the store with fresh data
            this.userStore.setProgress(progress);
            
            return progress;
        } catch (error) {
            console.error(`Error fetching progress for user ${userId}:`, error);
            return this.userStore.progress(); // Return cached data as fallback
        }
    }

    async getProgressByUser(userId: string): Promise<ProgressModel[]> {
        try {
            // First check if we have progress data in the store
            const storedProgress = this.userStore.progress();
            if (storedProgress.length > 0) {
                return storedProgress;
            }
            
            // If not, fetch from API
            return await this.refreshUserProgress(userId);
        } catch (error: any) {
            console.error(`Error fetching progress for user ${userId}:`, error);
            return [];
        }
    }
    
    // Build and update the lesson-course mapping
    async buildLessonCourseMapping(courseId: string): Promise<void> {
        try {
            // Get all lessons for this course
            const lessons = await this.lessonService.getLessonsByCourse(courseId);
            
            // Create mapping object
            const mapping: {[lessonId: string]: string} = {};
            lessons.forEach(lesson => {
                mapping[lesson.lessonId] = courseId;
            });
            
            // Update the store with this mapping
            this.userStore.updateLessonCourseMaps(mapping);
            
            console.log(`Built lesson-course mapping for ${lessons.length} lessons in course ${courseId}`);
        } catch (error) {
            console.error('Error building lesson-course mapping:', error);
        }
    }

    async calculateCourseProgress(courseId: string, lessons: LessonModel[]): Promise<CourseProgress> {
        try {
            const userId = this.authService.getCurrentUserId();

            if (!userId || lessons.length === 0) {
                return {
                    courseId,
                    courseTitle: '',
                    completedLessons: 0,
                    totalLessons: lessons.length,
                    percentComplete: 0,
                    lessons: lessons.map(lesson => ({
                        lessonId: lesson.lessonId,
                        lessonTitle: lesson.title,
                        completed: false
                    }))
                };
            }
            
            // Update lesson-course mapping to ensure we have current data
            if (lessons.length > 0) {
                const mapping: {[lessonId: string]: string} = {};
                lessons.forEach(lesson => {
                    mapping[lesson.lessonId] = courseId;
                });
                this.userStore.updateLessonCourseMaps(mapping);
            }

            // Get user's progress data
            const userProgresses = await this.getProgressByUser(userId);
            console.log(`Found ${userProgresses.length} progress records for course calculation`);

            // Create lesson progress array
            const lessonProgress: LessonProgress[] = lessons.map(lesson => {
                // Check if this lesson has a progress entry
                const progress = userProgresses.find(p => p.lessonId === lesson.lessonId);
                
                return {
                    lessonId: lesson.lessonId,
                    lessonTitle: lesson.title,
                    completed: !!progress,
                    watchedAt: progress?.watchedAt
                };
            });

            // Calculate completed lessons
            const completedLessons = lessonProgress.filter(lp => lp.completed).length;
            const percentComplete = lessons.length > 0 
                ? Math.round((completedLessons / lessons.length) * 100)
                : 0;

            return {
                courseId,
                courseTitle: '',
                completedLessons,
                totalLessons: lessons.length,
                percentComplete,
                lessons: lessonProgress
            };
        } catch (error) {
            console.error(`Error calculating progress for course ${courseId}:`, error);
            
            // Fallback to empty progress
            return {
                courseId,
                courseTitle: '',
                completedLessons: 0,
                totalLessons: lessons.length,
                percentComplete: 0,
                lessons: lessons.map(lesson => ({
                    lessonId: lesson.lessonId,
                    lessonTitle: lesson.title,
                    completed: false
                }))
            };
        }
    }

    async markLessonCompleted(lessonId: string): Promise<boolean> {
        try {
            const userId = this.authService.getCurrentUserId();
            
            if (!userId) {
                this.notifyService.error('You must be logged in to track progress');
                return false;
            }
    
            // Create a temporary ID for new progress
            const tempProgressId = '00000000-0000-0000-0000-000000000000';
    
            // Create the progress object with ONLY the fields that exactly match ProgressDTO
            // Check your ProgressDTO.cs to ensure field names match exactly
            const progressData = {
                progressId: tempProgressId,
                userId: userId,
                lessonId: lessonId,
                watchedAt: new Date().toISOString()
            };
            
            // Use the URL that you've confirmed reaches the controller
            const url = `${environment.apiUrl}progresses/${tempProgressId}`;
            
            const response$ = this.http.post<ProgressModel>(url, progressData);
            const result = await firstValueFrom(response$);
            
            this.userStore.addProgress(result);
            this.notifyService.success('Lesson marked as completed!');
            
            return true;
        } catch (error: any) {
            console.error('Error marking lesson as completed:', error);
            this.notifyService.error('Failed to mark lesson as completed: ' + (error.error || error.message));
            return false;
        }
    }
    async isLessonCompleted(lessonId: string): Promise<boolean> {
        try {
            const userId = this.authService.getCurrentUserId();
            
            if (!userId) return false;
    
            // Check if progress exists for this user and lesson
            const progress = await this.getProgressByUser(userId);
            return progress.some(p => p.lessonId === lessonId);
        } catch (error) {
            console.error('Error checking lesson completion', error);
            return false;
        }
    }
}