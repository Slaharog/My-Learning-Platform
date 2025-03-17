import { inject, Injectable } from '@angular/core';
import { CourseModel } from '../models/course.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CourseStore } from '../../storage/course.store';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class CourseService {
    // private http = inject(HttpClient);
    private courseStore = inject(CourseStore);

    constructor(
        private http: HttpClient,
        private router: Router
    ) { }

    public async getCourses(): Promise<CourseModel[]> {
        if (this.courseStore.count()) return this.courseStore.courses();
        // Always fetch fresh data from the server
        const courses$ = this.http.get<CourseModel[]>(environment.courseUrl);
        const courses: CourseModel[] = await firstValueFrom(courses$);
        console.log(courses);
        this.courseStore.initCourses(courses);
        return courses;
    }

    public async getOneCourse(courseId: string): Promise<CourseModel> {
        const course = this.courseStore.getOneCourse(courseId);
        if (course) return course;
        const course$ = this.http.get<CourseModel>(environment.courseUrl + courseId);
        const dbCourse = await firstValueFrom(course$);
        return dbCourse;
    }


    public async addCourse(course: CourseModel): Promise<CourseModel> {
        const dbCourse$ = this.http.post<CourseModel>(environment.courseUrl, course);
        const dbCourse = await firstValueFrom(dbCourse$);
        this.courseStore.addCourse(dbCourse);
        return dbCourse;
    }

    // public async updateCourse(course: CourseModel): Promise<void> {
    //     const dbCourse$ = this.http.put<CourseModel>(environment.courseUrl + course.courseId, CourseModel.toFormData(course));
    //     const dbCourse = await firstValueFrom(dbCourse$);
    //     this.courseStore.updateCourse(dbCourse);
    // }
    public async updateCourse(course: CourseModel): Promise<void> {
            // Check if we should use FormData like in CourseService
            // Your CourseService uses FormData for updates, so let's try both approaches
            
            try {
                const dbCourse$ = this.http.put<CourseModel>(
                    `${environment.courseUrl}${course.courseId}`, 
                    course
                );
                
                const dbCourse = await firstValueFrom(dbCourse$);
                this.courseStore.updateCourse(dbCourse);
            } catch (error: any) {
                console.log(error.message);
            }
            this.router.navigateByUrl("courses")
        }

    public async deleteCourse(id: string): Promise<void> {
        const observable$ = this.http.delete(environment.courseUrl + id);
        await firstValueFrom(observable$)
        this.courseStore.deleteCourse(id);
    }
}
