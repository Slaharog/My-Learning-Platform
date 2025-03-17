import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LessonModel } from '../../../models/lesson.model';
import { LessonService } from '../../../services/lesson.service';
import { NotifyService } from '../../../services/notify.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { LessonStore } from '../../../../storage/lessons.store';

@Component({
    selector: 'app-lesson-details',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './lesson-details.component.html'
})

export class LessonDetailsComponent implements OnInit {
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

    //   async ngOnInit(): Promise<void> {
    //     // Determine if we're editing an existing lesson
    //     this.isEditMode = !!this.lessonId;

    //     if (this.isEditMode) {
    //       try {
    //         // Load the lesson data
    //         const lesson = await this.lessonService.getOneLesson(this.lessonId);

    //         // Populate the form
    //         this.lessonForm.patchValue({
    //           title: lesson.title,
    //           videoUrl: lesson.videoUrl
    //         });
    //       } catch (error: any) {
    //         this.notyf.error(error.message);
    //         console.error('Error loading lesson:', error);
    //         this.router.navigate(['/courses', this.courseId]);
    //       }
    //     }
    //   }

    ngOnInit(): void {
        // Get courseId from route parameters
        this.route.params.subscribe(params => {
            this.courseId = params['courseId'];
            // this.lessonId = params['lessonId'];

            if (this.lessonId) {
                this.isEditMode = true;
                this.loadLessonData(this.lessonId);
            }
        });
    }

    private async loadLessonData(lessonId: string): Promise<void> {
        try {
            const lesson = await this.lessonService.getOneLesson(lessonId);
            this.lessonForm.setValue({
                title: lesson.title,
                videoUrl: lesson.videoUrl
            });
        } catch (error) {
            this.notyf.error('Failed to load lesson data');
            console.error('Error loading lesson:', error);
        }
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
            this.router.navigate(['/courses']);
        } catch (error: any) {
            this.notyf.error(error.message || 'Failed to save lesson');
            console.error('Error saving lesson:', error);
        }
        
    }



    cancelEdit(): void {
        this.cancelled.emit();
    }
}