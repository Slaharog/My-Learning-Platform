import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CourseModel } from '../../../models/course.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../../services/course.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LessonService } from '../../../services/lesson.service';
import { NotifyService } from '../../../services/notify.service';
import { LessonModel } from '../../../models/lesson.model';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-add-course',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './add-course.component.html',
    styleUrl: './add-course.component.css'
})
export class AddCourseComponent implements OnInit {
    public course: CourseModel | null = null;
    public lessons: LessonModel[] = [];
    public courseForm: FormGroup;
    public isAddMode = false;

    constructor(
        private courseService: CourseService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private lessonService: LessonService,
        private notyfService: NotifyService,
        private formBuilder: FormBuilder,
        private http: HttpClient
    ) {
        this.courseForm = this.formBuilder.group({
            title: ['', [Validators.required]],
            description: ['', [Validators.required]]
        });
    }

    public async ngOnInit(): Promise<void> {
        try {
            const id: string = this.activatedRoute.snapshot.params["courseId"];
            if (!id || id === 'add') {
                this.isAddMode = true;
                this.course = new CourseModel(); // Initialize empty course
                this.lessons = []; // No lessons for a new course
                return; // Exit early - don't try to fetch
            }
            
            this.course = await this.courseService.getOneCourse(id);
            this.lessons = await this.lessonService.getLessonsByCourse(id);
        } catch (error: any) {
            this.notyfService.error(error.message);
            this.router.navigate(['/courses']);
        }
    }

    public async addCourse(): Promise<void> {
        if (this.courseForm.invalid) {
            return;
        }

        try {
            const newCourse = new CourseModel();
            newCourse.title = this.courseForm.value.title;
            newCourse.description = this.courseForm.value.description;
            newCourse.createdAt = new Date();

            console.log('Adding new course:', newCourse);

            // Make sure you're calling addCourse, not updateCourse
            await this.courseService.addCourse(newCourse);

            this.notyfService.success('Course added successfully');
            this.router.navigate(['/courses']);
        } catch (error) {
            console.error('Error adding course:', error);
            this.notyfService.error('Failed to add course. Please try again later.');
        }
    }

    public resetForm(): void {
        this.courseForm.reset();
    }

}
