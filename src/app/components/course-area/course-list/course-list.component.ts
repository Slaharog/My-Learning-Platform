import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CourseModel } from '../../../models/course.model';
import { CourseService } from '../../../services/course.service';
import { NotifyService } from '../../../services/notify.service';
import { EnrollmentModel } from '../../../models/enrollment.model';
import { UserStore } from '../../../../storage/user-store';
import { EnrollmentService } from '../../../services/enrollment.service';
import { CourseEnrollmentComponent } from "../course-enrollment/course-enrollment.component";

@Component({
    selector: 'app-course-list',
    imports: [CommonModule, RouterModule, DatePipe, FormsModule, ReactiveFormsModule],
    templateUrl: './course-list.component.html',
    styleUrl: './course-list.component.css'
})
export class CourseListComponent implements OnInit {
    public courses: CourseModel[] = [];
    public enrollment: EnrollmentModel;
    isEnrolled: boolean = false;

    public constructor(
        private courseService: CourseService,
        private router: Router,
        private notifyService: NotifyService,
        private enrollmentService: EnrollmentService
    ) { } // DI

    public async ngOnInit() {
        try {
            this.courses = await this.courseService.getCourses();
        }
        catch (err: any) {
            this.notifyService.error(err);
        }
    }

    public displayDetails(courseId: string) {
        this.router.navigateByUrl("/courses/" + courseId);
    }

    public navigateToAddCourse(): void {
        this.router.navigateByUrl('/courses/add');
    }

    viewCourseDetails(courseId: string): void {
        // Navigate to specific course details
        this.router.navigate(['/courses', courseId]);
    }
}
