import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { LessonModel } from '../../../models/lesson.model';
import { LessonService } from '../../../services/lesson.service';
import { NotifyService } from '../../../services/notify.service';
import { ProgressService } from '../../../services/progress.service';
import { AuthService } from '../../../services/auth.service';
import { UserStore } from '../../../../storage/user-store';
import { EnrollmentService } from '../../../services/enrollment.service';
import { StatusBadgeComponent } from "../../page-area/status-badge/status-badge.component";
import { ProgressBarComponent } from "../../page-area/progress-bar/progress-bar.component";

@Component({
    selector: 'app-lesson-details',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, StatusBadgeComponent, ProgressBarComponent],
    templateUrl: './lesson-details.component.html',
    styleUrl: './lesson-details.component.css'
})
export class LessonDetailsComponent implements OnInit {
    lesson: LessonModel | null = null;
    courseId: string = '';
    lessonId: string = '';
    isLoading = true;
    isCompleted = false;

    // Component modes
    viewMode: 'view' | 'edit' | 'add' = 'view';

    courseProgress: any = null;
    previousLessonId: string | null = null;
    nextLessonId: string | null = null;

    safeVideoUrl: SafeResourceUrl | null = null;
    isProcessing = false;

    lessonForm: FormGroup;
    private userStore = inject(UserStore)
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private lessonService: LessonService,
        private notifyService: NotifyService,
        private progressService: ProgressService,
        private authService: AuthService,
        private sanitizer: DomSanitizer,
        private formBuilder: FormBuilder,
        private enrollmentService: EnrollmentService,
    ) {
        // Initialize the form
        this.lessonForm = this.formBuilder.group({
            title: ['', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(100)
            ]],
            videoUrl: ['', [
                Validators.required,
                Validators.maxLength(2000)
            ]]
        });
    }

    ngOnInit(): void {
        // First, determine the route pattern to detect the mode
        const currentUrl = this.router.url;
        console.log('Current URL:', currentUrl);

        if (currentUrl.includes('/lessons/add')) {
            this.viewMode = 'add';
            console.log('Mode detected: ADD');
        } else if (currentUrl.includes('/lessons/edit')) {
            this.viewMode = 'edit';
            console.log('Mode detected: EDIT');
        } else {
            this.viewMode = 'view';
            console.log('Mode detected: VIEW');
        }

        // Process route parameters
        this.route.params.subscribe(async params => {
            console.log('Route params:', params);

            if (this.viewMode === 'add') {
                // For add mode, we expect courseId
                this.courseId = params['courseId'] || '';
                console.log('Add mode - Course ID:', this.courseId);

                // Initialize a new lesson model
                this.lesson = new LessonModel();
                this.lesson.courseId = this.courseId;
                this.isLoading = false;
            } else {
                // For view or edit mode, we expect lessonId
                this.lessonId = params['lessonId'] || '';
                console.log('View/Edit mode - Lesson ID:', this.lessonId);

                if (!this.lessonId) {
                    this.notifyService.error('Lesson ID is missing');
                    this.router.navigate(['/courses']);
                    return;
                }

                // Load existing lesson
                await this.loadLessonDetails();
            }
        });
    }

    async deleteLesson(): Promise<void> {
        if (!this.lesson || !this.lesson.lessonId) {
            this.notifyService.error('Cannot delete: Invalid lesson');
            return;
        }

        // Confirm deletion with the user
        if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
            return;
        }

        try {
            await this.lessonService.deleteLesson(this.lesson.lessonId);
            // Navigate back to the course page
            this.router.navigate(['/courses', this.courseId]);
        } catch (error) {
            console.error('Error deleting lesson:', error);
            this.notifyService.error('Failed to delete lesson. Please try again.');
        }
    }

    async loadLessonDetails(): Promise<void> {
        try {
            this.isLoading = true;

            // Fetch lesson details
            this.lesson = await this.lessonService.getOneLesson(this.lessonId);

            if (!this.lesson) {
                this.notifyService.error('Lesson not found');
                this.router.navigate(['/courses']);
                return;
            }

            // Set course ID if not already set
            this.courseId = this.lesson.courseId;
            console.log('Loaded lesson for course ID:', this.courseId);

            // Sanitize video URL
            this.safeVideoUrl = this.getEmbedUrl(this.lesson.videoUrl);

            // Check if lesson is completed (only needed for view mode)
            if (this.viewMode === 'view') {
                this.isCompleted = await this.checkLessonCompletion();

                // Load course progress data for navigation and progress display
                await this.loadCourseProgress();
            }

            // Populate form for edit mode
            if (this.viewMode === 'edit') {
                this.lessonForm.patchValue({
                    title: this.lesson.title,
                    videoUrl: this.lesson.videoUrl
                });
            }
        } catch (error) {
            console.error('Error loading lesson details:', error);
            this.notifyService.error('Failed to load lesson details');
        } finally {
            this.isLoading = false;
        }
    }


    getEmbedUrl(videoUrl: string): SafeResourceUrl {
        if (!videoUrl) return null;

        // YouTube embed conversion
        if (videoUrl.includes('youtube.com/watch?v=')) {
            const videoId = videoUrl.split('v=')[1]?.split('&')[0];
            if (videoId) {
                const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
            }
        }

        // Vimeo embed conversion
        if (videoUrl.includes('vimeo.com/')) {
            const videoId = videoUrl.split('vimeo.com/')[1]?.split('&')[0];
            if (videoId) {
                const embedUrl = `https://player.vimeo.com/video/${videoId}`;
                return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
            }
        }

        // Default: return the original URL as safe
        return this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
    }

    async checkLessonCompletion(): Promise<boolean> {
        try {
            return await this.progressService.isLessonCompleted(this.lessonId);
        } catch (error) {
            console.error('Error checking lesson completion', error);
            return false;
        }
    }

    async markLessonCompleted(): Promise<void> {
        if (!this.authService.isAuthenticated()) {
            this.notifyService.error("Please log in to mark lessons as completed");
            this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
            return;
        }

        // Check if already completed
        if (this.isCompleted) {
            this.notifyService.success('Lesson already marked as completed');
            return;
        }

        try {
            this.isProcessing = true;
            console.log('Attempting to mark lesson as completed:', this.lessonId);

            // Use the simplified method from ProgressService
            const success = await this.progressService.markLessonCompleted(this.lessonId);

            if (success) {
                // Update local state
                this.isCompleted = true;

                // Optional: Briefly show success message before redirecting
                setTimeout(() => {
                    this.router.navigate(['/courses', this.courseId]);
                }, 1500);
            }
        } catch (error) {
            console.error('Error marking lesson as completed:', error);
            this.notifyService.error('Failed to mark lesson as completed. Please try again.');
        } finally {
            this.isProcessing = false;
        }
    }

    // Preview video before saving (for add mode)
    previewVideo(): void {
        const videoUrl = this.lessonForm.get('videoUrl').value;
        if (videoUrl) {
            this.safeVideoUrl = this.getEmbedUrl(videoUrl);
        }
    }

    // Navigate to edit mode
    navigateToEdit(): void {
        this.router.navigate(['/lessons/edit', this.lessonId]);
    }

    async saveLesson(): Promise<void> {
        if (this.lessonForm.invalid) {
            Object.keys(this.lessonForm.controls).forEach(key => {
                const control = this.lessonForm.get(key);
                if (control) {
                    control.markAsTouched();
                }
            });

            this.notifyService.error('Please fill all required fields correctly');
            return;
        }

        try {
            const lessonData: LessonModel = {
                ...(this.lesson || new LessonModel()),
                title: this.lessonForm.value.title,
                videoUrl: this.lessonForm.value.videoUrl,
                courseId: this.courseId
            };

            console.log('Saving lesson with data:', lessonData);
            console.log('Current mode:', this.viewMode);

            if (this.viewMode === 'edit') {
                // Update existing lesson
                await this.lessonService.updateLesson(lessonData);
                this.notifyService.success('Lesson updated successfully');
                // Navigate to the lesson view
                this.router.navigate(['/lessons', this.lessonId]);
            } else if (this.viewMode === 'add') {
                // Add new lesson
                console.log('Adding lesson to course:', this.courseId);
                const newLesson = await this.lessonService.addLessonToCourse(this.courseId, lessonData);
                this.notifyService.success('Lesson added successfully');
                // Navigate back to the course
                this.router.navigate(['/courses', this.courseId]);
            }
        } catch (error) {
            console.error('Error saving lesson:', error);
            this.notifyService.error(`Failed to ${this.viewMode === 'edit' ? 'update' : 'add'} lesson`);
        }
    }

    cancelEdit(): void {
        if (this.viewMode === 'edit') {
            // Navigate back to view lesson
            this.router.navigate(['/lessons', this.lessonId]);
        } else {
            // Navigate back to course details
            this.router.navigate(['/courses', this.courseId]);
        }
    }

    // Method to navigate back to the course
    goToCourse(): void {
        if (this.courseId) {
            this.router.navigate(['/courses', this.courseId]);
        } else {
            this.router.navigate(['/courses']);
        }
    }

    async loadCourseProgress(): Promise<void> {
        if (!this.courseId) {
            console.error('Cannot load course progress: Course ID is missing');
            return;
        }

        try {
            // Get all lessons for this course
            const courseLessons = await this.lessonService.getLessonsByCourse(this.courseId);
            console.log('Loaded course lessons:', courseLessons);

            if (courseLessons && courseLessons.length > 0) {
                // Calculate course progress
                const progress = await this.progressService.calculateCourseProgress(
                    this.courseId,
                    courseLessons
                );

                this.courseProgress = progress;
                console.log('Course progress loaded:', this.courseProgress);

                // Set up navigation between lessons
                this.setupLessonNavigation(courseLessons);
            } else {
                console.warn('No lessons found for course:', this.courseId);
            }
        } catch (error) {
            console.error('Error loading course progress:', error);
            // Don't show error to user, just log it
        }
    }

    setupLessonNavigation(courseLessons: LessonModel[]): void {
        if (!courseLessons || courseLessons.length === 0 || !this.lessonId) {
            console.warn('Cannot setup lesson navigation: missing data');
            return;
        }

        console.log('Setting up lesson navigation with:', courseLessons.length, 'lessons');

        // Sort lessons by title (or any other field you prefer)
        const sortedLessons = [...courseLessons].sort((a, b) => {
            return a.title.localeCompare(b.title);
        });

        // Find current lesson index
        const currentIndex = sortedLessons.findIndex(l => l.lessonId === this.lessonId);
        console.log('Current lesson index:', currentIndex);

        if (currentIndex > 0) {
            this.previousLessonId = sortedLessons[currentIndex - 1].lessonId;
            console.log('Previous lesson ID set:', this.previousLessonId);
        }

        if (currentIndex < sortedLessons.length - 1) {
            this.nextLessonId = sortedLessons[currentIndex + 1].lessonId;
            console.log('Next lesson ID set:', this.nextLessonId);
        }
    }

    navigateToLesson(lessonId: string): void {
        this.router.navigate(['/lessons', lessonId]);
    }
}