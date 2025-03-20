import { inject, Injectable } from "@angular/core";
import { LessonModel } from '../models/lesson.model';
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { LessonStore } from "../../storage/lessons.store";
import { environment } from "../../environments/environment";
import { firstValueFrom } from "rxjs";
import { Router } from "@angular/router";
import { NotifyService } from "./notify.service";

// Interface for backend validation errors
interface ValidationError {
    property: string;
    error: string;
}

interface ValidationErrorResponse {
    errors: ValidationError[];
}

@Injectable({
    providedIn: 'root'
})
export class LessonService {
    private lessonStore = inject(LessonStore);

    constructor(
        private http: HttpClient,
        private notyf: NotifyService,
    ) { }

    public async getLessons(): Promise<LessonModel[]> {
        // Check store first to avoid unnecessary API calls
        if (this.lessonStore.count() > 0) {
            console.log('Returning lessons from store, count:', this.lessonStore.count());
            return this.lessonStore.lessons();
        }

        try {
            const lessons$ = this.http.get<LessonModel[]>(environment.lessonUrl);
            const lessons: LessonModel[] = await firstValueFrom(lessons$);
            console.log('Fetched lessons from API:', lessons.length);

            // Initialize store with fetched lessons
            this.lessonStore.initLessons(lessons);
            return lessons;
        } catch (error) {
            console.error('Error fetching lessons:', error);
            this.notyf.error('Failed to load lessons');
            return [];
        }
    }

    public async getOneLesson(id: string): Promise<LessonModel> {
        // Try to get from store first for better performance
        const lessonFromStore = this.lessonStore.getOneLesson(id);
        if (lessonFromStore) {
            console.log('Found lesson in store:', id);
            return lessonFromStore;
        }

        try {
            const lesson$ = this.http.get<LessonModel>(`${environment.lessonUrl}${id}`);
            const dbLesson = await firstValueFrom(lesson$);

            // Add to store for future use
            this.lessonStore.addLesson(dbLesson);

            return dbLesson;
        } catch (error) {
            console.error(`Error fetching lesson ${id}:`, error);
            this.notyf.error('Failed to load lesson details');
            throw error;
        }
    }

    public async getLessonsByCourse(courseId: string): Promise<LessonModel[]> {
        // Try store first if it has data
        if (this.lessonStore.count() > 0) {
            const lessonsFromStore = this.lessonStore.getLessonsByCourse(courseId);
            if (lessonsFromStore && lessonsFromStore.length > 0) {
                console.log(`Found ${lessonsFromStore.length} lessons for course ${courseId} in store`);
                return lessonsFromStore;
            }
        }

        try {
            // Use the proper endpoint from the API for course lessons
            const lessons$ = this.http.get<LessonModel[]>(`${environment.lessonUrl}course/${courseId}`);
            const lessons: LessonModel[] = await firstValueFrom(lessons$);
            console.log(`Fetched ${lessons.length} lessons for course ${courseId} from API`);

            // Add to store for future use
            lessons.forEach(lesson => {
                if (!this.lessonStore.getOneLesson(lesson.lessonId)) {
                    this.lessonStore.addLesson(lesson);
                }
            });

            return lessons;
        } catch (error) {
            console.error(`Error fetching lessons for course ${courseId}:`, error);
            this.notyf.error('Failed to load lessons for this course');
            return [];
        }
    }

    async addLesson(lesson: LessonModel): Promise<LessonModel> {
        try {
            const url = `${environment.lessonUrl}${lesson.courseId}`;

            // Remove the lessonId if it's the default value
            if (lesson.lessonId === '00000000-0000-0000-0000-000000000000') {
                delete lesson.lessonId;
            }

            // Make the API call with the courseId in the URL, not the body
            const dbLesson$ = this.http.post<LessonModel>(url, lesson);
            const dbLesson = await firstValueFrom(dbLesson$);
            this.lessonStore.addLesson(dbLesson);
            this.notyf.success('Lesson added successfully');
            return dbLesson;
        } catch (error: any) {
            throw error;
        }
    }

    public async updateLesson(lesson: LessonModel): Promise<LessonModel> {
        try {
            const dbLesson$ = this.http.put<LessonModel>(
                `${environment.lessonUrl}${lesson.lessonId}`,
                lesson
            );
            const dbLesson = await firstValueFrom(dbLesson$);
            console.log('Lesson updated successfully:', dbLesson);
            this.lessonStore.updateLesson(dbLesson);
            return dbLesson;
        } catch (error: any) {
            console.error(`Error updating lesson ${lesson.lessonId}:`, error);
            if (error instanceof HttpErrorResponse && error.status === 400) {
                this.handleValidationErrors(error);
            }
            throw error;
        }
    }

    public async deleteLesson(id: string): Promise<void> {
        try {
            await firstValueFrom(this.http.delete(`${environment.lessonUrl}${id}`));
            this.lessonStore.deleteLesson(id);
            this.notyf.success('Lesson deleted successfully');
        } catch (error) {
            throw error;
        }
    }

    public async addLessonToCourse(courseId: string, lesson: LessonModel): Promise<LessonModel> {
        lesson.courseId = courseId;
        return this.addLesson(lesson);
    }

    private handleValidationErrors(error: HttpErrorResponse): void {
        try {
            const response = error.error as ValidationErrorResponse;

            if (response.errors && response.errors.length > 0) {
                // Display each validation error
                for (const validationError of response.errors) {
                    this.notyf.error(`${validationError.property}: ${validationError.error}`);
                }
            } else if (typeof error.error === 'string') {
                this.notyf.error(error.error);
            } else {
                this.notyf.error('Validation failed. Please check your inputs.');
            }
        } catch (e) {
            this.notyf.error('An error occurred while processing validation errors.');
        }
    }
}