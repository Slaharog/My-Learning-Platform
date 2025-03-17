import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CourseModel } from '../../../models/course.model';
import { CourseService } from '../../../services/course.service';
import { NotifyService } from '../../../services/notify.service';

@Component({
    selector: 'app-course-list',
    imports: [CommonModule, RouterModule, DatePipe, FormsModule, ReactiveFormsModule],
    templateUrl: './course-list.component.html',
    styleUrl: './course-list.component.css'
})
export class CourseListComponent implements OnInit {
    public courses: CourseModel[] = [];

    public constructor(
        private courseService: CourseService,
        private router: Router,
        private notifyService: NotifyService
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
}
