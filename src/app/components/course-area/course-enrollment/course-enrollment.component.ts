import { Component, inject, Input, OnInit } from '@angular/core';
import { EnrollmentService } from '../../../services/enrollment.service';
import { AuthService } from '../../../services/auth.service';
import { NotifyService } from '../../../services/notify.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../../../storage/user-store';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-course-enrollment',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './course-enrollment.component.html',
    styleUrl: './course-enrollment.component.css'
})
export class CourseEnrollmentComponent implements OnInit {
    @Input() courseId: string = '';

    isEnrolled = false;
    loading = false;
    currentUrl: string;

    private userStore = inject(UserStore);
    private enrollmentService = inject(EnrollmentService);
    private notifyService = inject(NotifyService);
    private router = inject(Router);

    constructor(
        public authService: AuthService // Public so we can access in template
    ) { }

    ngOnInit(): void {
        // Store current URL for login redirect
        this.currentUrl = this.router.url;
        
        // Check enrollment status when component initializes
        this.checkEnrollmentStatus();
    }

    async checkEnrollmentStatus(): Promise<void> {
        if (!this.authService.isAuthenticated()) return;

        try {
            const enrollments = await this.enrollmentService.getUserEnrollments();
            this.isEnrolled = enrollments.some(e => e.courseId === this.courseId);
        } catch (error) {
            console.error('Error checking enrollment status', error);
        }
    }

    async enrollInCourse(): Promise<void> {
        if (!this.authService.isAuthenticated()) {
            this.notifyService.error('Please log in to enroll in courses');
            this.router.navigate(['/login'], {
                queryParams: { returnUrl: this.router.url }
            });
            return;
        }

        try {
            this.loading = true;
            await this.enrollmentService.enrollStudentInCourse(this.courseId);
            this.isEnrolled = true;
            this.notifyService.success('Successfully enrolled in the course');
        } catch (error) {
            // Error already handled in service
            console.error('Error enrolling in course:', error);
        } finally {
            this.loading = false;
        }
    }

    async unenrollFromCourse(): Promise<void> {
        if (!this.authService.isAuthenticated()) {
            this.notifyService.error('Please log in');
            return;
        }

        if (!confirm('Are you sure you want to unenroll from this course? Your progress will be preserved.')) {
            return;
        }

        try {
            this.loading = true;
            await this.enrollmentService.unenrollFromCourse(this.courseId);
            this.isEnrolled = false;
            this.notifyService.success('Successfully unenrolled from the course');
        } catch (error) {
            // Error already handled in service
            console.error('Error unenrolling from course:', error);
        } finally {
            this.loading = false;
        }
    }
}