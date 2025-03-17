import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LessonService } from '../../../services/lesson.service';
import { NotifyService } from '../../../services/notify.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LessonModel } from '../../../models/lesson.model';

@Component({
    selector: 'app-add-lesson',
    imports: [],
    templateUrl: './add-lesson.component.html',
    styleUrl: './add-lesson.component.css'
})
export class AddLessonComponent {

    @Input() courseId: string;
    @Input() lessonId: string;
    @Output() lessonSaved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    public lessonForm: FormGroup;
    public isEditMode = false;

    constructor(
        private lessonService: LessonService,
        private formBuilder: FormBuilder,
        private notyf: NotifyService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.lessonForm = this.formBuilder.group({
            title: ['', [Validators.required]],
            videoUrl: ['', [Validators.required]]
        });
    }

    async saveLesson(): Promise<void> {
        if (this.lessonForm.invalid) {
            this.notyf.error('Please fill all required fields');
            return;
        }

        try {
            if (!this.courseId) {
                throw new Error('Course ID is missing. Please ensure you are on the correct page.');
            }

            const lesson = new LessonModel();

            // Important: Set as empty string for new lessons
            lesson.lessonId = this.isEditMode && this.lessonId ? this.lessonId : '';

            // Ensure courseId is a valid GUID string
            lesson.courseId = this.courseId;
            lesson.title = this.lessonForm.value.title;
            lesson.videoUrl = this.lessonForm.value.videoUrl;

            console.log('Saving lesson with data:', lesson);

            if (this.isEditMode && this.lessonId) {
                await this.lessonService.updateLesson(lesson);
                this.notyf.success('Lesson updated successfully');
            } else {
                await this.lessonService.addLesson(lesson);
                this.notyf.success('Lesson added successfully');
            }

            // Navigate back to course details
            this.router.navigate(['/courses', this.courseId]);
        } catch (error: any) {
            this.notyf.error(error.message || 'Failed to save lesson');
            console.error('Error saving lesson:', error);
        }

    }
}

