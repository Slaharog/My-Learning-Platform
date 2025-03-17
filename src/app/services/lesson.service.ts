import { inject, Injectable } from "@angular/core";
import { LessonStore } from "../../storage/lessons.store";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { LessonModel } from "../models/lesson.model";
import { environment } from "../../environments/environment";
import { firstValueFrom } from "rxjs";
import { Router } from "@angular/router";

@Injectable({
    providedIn: 'root'
})
export class LessonService {
    private lessonStore = inject(LessonStore);

    constructor(private http: HttpClient) { }

    public async getLessons(): Promise<LessonModel[]> {
        if (this.lessonStore.count()) return this.lessonStore.lessons();
        const lessons$ = this.http.get<LessonModel[]>(environment.lessonUrl); // Returns Observable
        const lessons: LessonModel[] = await firstValueFrom(lessons$);
        console.log(lessons);
        this.lessonStore.initLessons(lessons);
        return lessons;
    }

    public async getOneLesson(id: string): Promise<LessonModel> {
        const lesson = this.lessonStore.getOneLesson(id);
        if (lesson) return lesson;
        const lesson$ = this.http.get<LessonModel>(environment.lessonUrl + id);
        const dbLesson = await firstValueFrom(lesson$);
        return dbLesson;
    }

    public async getLessonsByCourse(courseId: string): Promise<LessonModel[]> {
        if (this.lessonStore.count()) return this.lessonStore.getLessonsByCourse(courseId);
        const lessons$ = this.http.get<LessonModel[]>(environment.lessonUrl); // Returns Observable
        const lessons: LessonModel[] = await firstValueFrom(lessons$);
        console.log(lessons);
        this.lessonStore.initLessons(lessons);
        return lessons;
    }

    // public async addLesson(lesson: LessonModel): Promise<void> {
    //     const dbLesson$ = this.http.post<LessonModel>(environment.lessonUrl, lesson.courseId);
    //     const dbLesson = await firstValueFrom(dbLesson$);
    //     this.lessonStore.addLesson(dbLesson);
    // }

    // async addLesson(lesson: LessonModel): Promise<void> {
    //     // Set proper headers
    //     const headers = new HttpHeaders({
    //       'Content-Type': 'application/json'
    //     });
    
    //     // Pass the entire lesson object, not just courseId
    //     const dbLesson$ = this.http.post<LessonModel>(
    //       environment.lessonUrl, 
    //       lesson, 
    //       { headers }
    //     );
        
    //     const dbLesson = await firstValueFrom(dbLesson$);
    //     this.lessonStore.addLesson(dbLesson);
    //   }

    // async addLesson(lesson: LessonModel): Promise<void> {
    //     // Set proper headers
    //     const headers = new HttpHeaders({
    //       'Content-Type': 'application/json'
    //     });
    
    //     // Following the pattern used in your CourseService for adding courses
    //     const dbLesson$ = this.http.post<LessonModel>(
    //       environment.lessonUrl + lesson.courseId, 
    //       lesson, // Explicitly stringify the object
    //       { headers }
    //     );
        
    //     try {
    //         console.log('Sending lesson data:', lesson);
            
    //         const dbLesson = await firstValueFrom(dbLesson$);
    //         console.log('Response from server:', dbLesson);
    //         this.lessonStore.addLesson(dbLesson);
    //     } catch (error) {
    //         console.error('Error in addLesson:', error);
    //         throw error;
    //     }
    // }

    async addLesson(lesson: LessonModel): Promise<void> {

        const url = `${environment.lessonUrl}${lesson.courseId}`;
        lesson.lessonId = undefined;
        console.log('Adding lesson to URL:', url);
        console.log('With data:', lesson);
        
        
        try {
            const dbLesson$ = this.http.post<LessonModel>(
                url, 
                lesson
            );
            
            const dbLesson = await firstValueFrom(dbLesson$);
            console.log('Lesson added successfully:', dbLesson);
            this.lessonStore.addLesson(dbLesson);
        } catch (error) {
            console.error('Error adding lesson:', error);
            throw error;
        }
    }
    

    // public async updateLesson(lesson: LessonModel): Promise<void> {
    //     const dbLesson$ = this.http.put<LessonModel>(environment.lessonUrl + lesson.lessonId, lesson);
    //     const dbLesson = await firstValueFrom(dbLesson$);
    //     this.lessonStore.updateLesson(dbLesson);
    // }

    public async updateLesson(lesson: LessonModel): Promise<void> {
        // Check if we should use FormData like in CourseService
        // Your CourseService uses FormData for updates, so let's try both approaches
        
        try {
            // Method 1: Use JSON
            const dbLesson$ = this.http.put<LessonModel>(
                `${environment.lessonUrl}edit/${lesson.lessonId}`, 
                lesson, // Let Angular handle serialization
            );
            
            const dbLesson = await firstValueFrom(dbLesson$);
            this.lessonStore.updateLesson(dbLesson);
        } catch (error: any) {
            console.log(error.message);
        }
    }

    public async deleteLesson(id: string): Promise<void> {

        const observable$ = this.http.delete(environment.lessonUrl + id);
        await firstValueFrom(observable$)
        this.lessonStore.deleteLesson(id);

    }

    async addLessonToCourse(courseId: string, lesson: LessonModel): Promise<void> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        
        // Create a course-specific URL
        const url = `${environment.lessonUrl}${courseId}`;
        
        console.log('Trying course-specific endpoint:', url);
        console.log('With data:', lesson);
        
        try {
            const dbLesson$ = this.http.post<LessonModel>(url, lesson, { headers });
            const dbLesson = await firstValueFrom(dbLesson$);
            console.log('Success with course-specific endpoint! Response:', dbLesson);
            this.lessonStore.addLesson(dbLesson);
        } catch (error) {
            console.error('Course-specific endpoint failed with error:', error);
            throw error;
        }
    }
    
    // public async updateLesson(lesson: LessonModel): Promise<void> {
    //     // Check if we should use FormData like in CourseService
    //     // Your CourseService uses FormData for updates, so let's try both approaches
        
    //     try {
    //         // Method 1: Use JSON
    //         const headers = new HttpHeaders({
    //             'Content-Type': 'application/json'
    //         });
            
    //         const dbLesson$ = this.http.put<LessonModel>(
    //             `${environment.lessonUrl}/${lesson.lessonId}`, 
    //             lesson, // Let Angular handle serialization
    //             { headers }
    //         );
            
    //         const dbLesson = await firstValueFrom(dbLesson$);
    //         this.lessonStore.updateLesson(dbLesson);
    //     } catch (error) {
    //         // Method 2: Try using FormData like CourseService does
    //         console.log('JSON update failed, trying FormData approach');
            
    //         const formData = LessonModel.toFormData(lesson);
    //         // Add courseId since it's not in the toFormData method
    //         formData.append('courseId', lesson.courseId);
            
    //         const dbLesson$ = this.http.put<LessonModel>(
    //             `${environment.lessonUrl}/${lesson.lessonId}`,
    //             formData
    //         );
            
    //         const dbLesson = await firstValueFrom(dbLesson$);
    //         this.lessonStore.updateLesson(dbLesson);
    //     }
    // }
}