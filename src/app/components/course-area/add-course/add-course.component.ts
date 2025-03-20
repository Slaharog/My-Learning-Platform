import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CourseModel } from '../../../models/course.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../../services/course.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotifyService } from '../../../services/notify.service';

@Component({
    selector: 'app-add-course',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './add-course.component.html',
    styleUrl: './add-course.component.css'
})
export class AddCourseComponent implements OnInit {
    public courseForm: FormGroup;
    public isSubmitting = false;
    public isEditMode = false;
    public courseId: string;

    constructor(
        private courseService: CourseService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private notifyService: NotifyService,
        private formBuilder: FormBuilder
    ) {
        this.initForm();
    }

    public async ngOnInit(): Promise<void> {
        // Check route parameters to determine if we're in edit mode
        this.activatedRoute.params.subscribe(async params => {
            this.courseId = params['courseId'];
            
            if (this.courseId && this.courseId !== 'add') {
                this.isEditMode = true;
                await this.loadCourseData(this.courseId);
            } else {
                this.isEditMode = false;
            }
        });
    }

    private initForm(): void {
        this.courseForm = this.formBuilder.group({
            title: ['', [
                Validators.required, 
                Validators.minLength(3), 
                Validators.maxLength(100)
            ]],
            description: ['', [
                Validators.required, 
                Validators.minLength(10), 
                Validators.maxLength(1000)
            ]]
        });
    }

    private async loadCourseData(courseId: string): Promise<void> {
        try {
            const course = await this.courseService.getOneCourse(courseId);
            
            // Update form with course data
            this.courseForm.patchValue({
                title: course.title,
                description: course.description
            });
        } catch (error) {
            console.error('Error loading course data:', error);
            this.notifyService.error('Failed to load course data');
            this.router.navigate(['/courses']);
        }
    }

    public async saveCourse(): Promise<void> {
        if (this.courseForm.invalid) {
            // Mark all fields as touched to show validation errors
            Object.keys(this.courseForm.controls).forEach(key => {
                this.courseForm.get(key).markAsTouched();
            });
            return;
        }

        try {
            this.isSubmitting = true;
            
            const courseData = {
                title: this.courseForm.value.title,
                description: this.courseForm.value.description,
                createdAt: new Date()
            } as CourseModel;

            if (this.isEditMode) {
                // Update existing course
                courseData.courseId = this.courseId;
                await this.courseService.updateCourse(courseData, this.courseId);
                this.notifyService.success('Course updated successfully');
            } else {
                // Add new course
                await this.courseService.addCourse(courseData);
                this.notifyService.success('Course added successfully');
            }
            
            this.router.navigate(['/courses']);
        } catch (error) {
            console.error('Error saving course:', error);
            this.notifyService.error(`Failed to ${this.isEditMode ? 'update' : 'add'} course`);
        } finally {
            this.isSubmitting = false;
        }
    }

    public resetForm(): void {
        if (this.isEditMode) {
            // If editing, reload the original course data
            this.loadCourseData(this.courseId);
        } else {
            // If adding new, just reset the form
            this.courseForm.reset();
        }
    }

    public cancel(): void {
        if (this.isEditMode) {
            this.router.navigate(['/courses', this.courseId]);
        } else {
            this.router.navigate(['/courses']);
        }
    }
    
    // Helper methods for template
    public hasError(controlName: string): boolean {
        const control = this.courseForm.get(controlName);
        return control ? (control.invalid && control.touched) : false;
    }
    
    public getErrorMessage(controlName: string): string {
        const control = this.courseForm.get(controlName);
        
        if (!control || !control.errors || !control.touched) {
            return '';
        }
        
        if (control.errors['required']) {
            return 'This field is required';
        }
        
        if (control.errors['minlength']) {
            return `Minimum length is ${control.errors['minlength'].requiredLength} characters`;
        }
        
        if (control.errors['maxlength']) {
            return `Maximum length is ${control.errors['maxlength'].requiredLength} characters`;
        }
        
        return 'Invalid input';
    }
}