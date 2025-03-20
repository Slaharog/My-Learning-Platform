import { inject, Injectable } from '@angular/core';
import { CourseModel } from '../models/course.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CourseStore } from '../../storage/course.store';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { NotifyService } from './notify.service';
import { EnrollmentModel } from '../models/enrollment.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class CourseService {
    private courseStore = inject(CourseStore);

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private notyf: NotifyService
    ) { }

    public async getCourses(): Promise<CourseModel[]> {
        try {
            // IMPORTANT: Always get a fresh list from the API to ensure we have all courses
            console.log('Fetching all courses from API');
            const courses$ = this.http.get<CourseModel[]>(environment.courseUrl);
            const courses: CourseModel[] = await firstValueFrom(courses$);
            
            // Update the store with the fresh data
            this.courseStore.initCourses(courses);
            
            console.log(`Fetched ${courses.length} courses from API`);
            return courses;
        } catch (error) {
            console.error('Error fetching courses:', error);
            this.notyf.error('Failed to load courses');
            
            // Fallback to store if API call fails
            return this.courseStore.courses();
        }
    }

    public async getOneCourse(courseId: string): Promise<CourseModel> {
        const courseFromStore = this.courseStore.getOneCourse(courseId);
        if (courseFromStore) {
            console.log('Found course in store:', courseId);
            return courseFromStore;
        }
        try {
            const course$ = this.http.get<CourseModel>(`${environment.courseUrl}${courseId}`);
            const dbCourse = await firstValueFrom(course$);
            if (!this.courseStore.getOneCourse(courseId)) {
                this.courseStore.addCourse(dbCourse);
            }
            return dbCourse;
        } catch (error) {
            console.error(`Error fetching course ${courseId}:`, error);
            throw error;
        }
    }


    public async addCourse(course: CourseModel): Promise<CourseModel> {
        try {
            const dbCourse$ = this.http.post<CourseModel>(environment.courseUrl, course);
            const dbCourse = await firstValueFrom(dbCourse$);
            this.courseStore.addCourse(dbCourse);
            this.notyf.success('Course added successfully');
            return dbCourse;
        } catch (error) {
            console.error('Error adding course:', error);
            throw error;
        }
    }


    public async updateCourse(course: CourseModel, id: string): Promise<void> {
        try {
            const dbCourse$ = this.http.put<CourseModel>(`${environment.courseUrl}${id}`, course);
            const dbCourse = await firstValueFrom(dbCourse$);
            this.courseStore.updateCourse(dbCourse);
            this.notyf.success('Course updated successfully');
            return;
        } catch (error) {
            console.error(`Error updating course ${id}:`, error);
            throw error;
        }
    }

    public async deleteCourse(id: string): Promise<void> {
        try {
            const observable$ = this.http.delete(`${environment.courseUrl}${id}`);
            await firstValueFrom(observable$);
            this.courseStore.deleteCourse(id);
            this.notyf.success('Course deleted successfully');
        } catch (error) {
            throw error;
        }
    }
    async getUserEnrolledCourses(): Promise<CourseModel[]> {
        try {
            const userId = this.authService.getCurrentUserId();
            
            if (!userId) {
                return [];
            }

            // Endpoint to get user's enrolled courses
            const url = `${environment.apiUrl}users/enrollments/${userId}`;
            const enrollments = await firstValueFrom(
                this.http.get<EnrollmentModel[]>(url)
            );

            // Fetch details for each enrolled course
            const coursePromises = enrollments.map(enrollment => 
                this.getOneCourse(enrollment.courseId)
            );

            return await Promise.all(coursePromises);
        } catch (error) {
            console.error('Error fetching enrolled courses', error);
            return [];
        }
    }
}
