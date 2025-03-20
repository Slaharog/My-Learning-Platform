import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseModel } from '../../../models/course.model';
import { CourseService } from '../../../services/course.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotifyService } from '../../../services/notify.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-update-course',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './update-course.component.html',
    styleUrl: './update-course.component.css'
})

export class UpdateCourseComponent implements OnInit {
    public courseForm: FormGroup;
    public course: CourseModel;
    public isLoading = false;

    constructor(
        private formBuilder: FormBuilder,
        private courseService: CourseService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private notifyService: NotifyService
    ) { }

    public async ngOnInit(): Promise<void> {
        this.initForm();
        try {
            const courseId = this.activatedRoute.snapshot.params['courseId'];
            this.isLoading = true;
            this.course = await this.courseService.getOneCourse(courseId);
            this.populateFormWithCourse();
            this.isLoading = false;
        } catch (err: any) {
            this.isLoading = false;
            this.notifyService.error(err);
            this.router.navigateByUrl('/courses');
        }
    }

    private initForm(): void {
        this.courseForm = this.formBuilder.group({
            title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
        });
    }

    private populateFormWithCourse(): void {
        this.courseForm.patchValue({
            title: this.course.title,
            description: this.course.description,
        });
    }

    public async onSubmit(): Promise<void> {
        try {
            this.isLoading = true;
            await this.courseService.updateCourse(this.courseForm.value, this.course.courseId);
            this.notifyService.success('Course updated successfully!');
            this.router.navigateByUrl(`/courses/${this.course.courseId}`);
        } catch (err: any) {
            this.notifyService.error(err.message);
        } finally {
            this.isLoading = false;
        }
    }

    public cancel(): void {
        this.router.navigateByUrl(`/courses/${this.course.courseId}`);
    }
}