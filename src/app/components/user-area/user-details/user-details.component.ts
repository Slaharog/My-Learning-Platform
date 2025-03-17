import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { NotifyService } from '../../../services/notify.service';
import { UserModel } from '../../../models/user.model';
import { UserStore } from '../../../../storage/user-store';
import { CourseWithProgress, ProgressService } from '../../../services/progress.service';

@Component({
    selector: 'app-user-details',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './user-details.component.html'
})
export class UserDetailsComponent implements OnInit {
    private userService = inject(UserService);
    private userStore = inject(UserStore);
    private formBuilder = inject(FormBuilder);
    private notyf = inject(NotifyService);
    private progressService = inject(ProgressService);
    public enrolledCoursesWithProgress: CourseWithProgress[] = [];


    public user: UserModel | null = null;
    public enrolledCourses: CourseWithProgress[] = [];
    public isEditing = false;
    public profileForm: FormGroup;

    constructor() {
        this.profileForm = this.formBuilder.group({
            fullName: [''],
            bio: [''],
            location: ['']
        });
    }



    ngOnInit(): void {
        // Get the basic user data
        this.user = this.userStore.getMyUser();

        // Get enrollments and progress from the store
        const enrollments = this.userStore.enrollments();
        const progress = this.userStore.progress();

        // Use the service to combine data from multiple stores
        this.enrolledCoursesWithProgress = this.progressService.getCoursesWithProgress(
            enrollments,
            progress
        );
    }

    loadEnrolledCourses(): void {
        // Get enrollments and progress from the store
        const enrollments = this.userStore.enrollments();
        this.userStore.setEnrollments(enrollments);
        const progress = this.userStore.progress();
        this.userStore.setProgress(progress);

        // Use the service to combine data from multiple stores
        this.enrolledCourses = this.progressService.getCoursesWithProgress(
            enrollments,
            progress
        );
    }

    toggleEdit(): void {
        this.isEditing = true;

        if (this.user) {
            this.profileForm.patchValue({
                fullName: this.user.name || '',
            });
        }
    }

    cancelEdit(): void {
        this.isEditing = false;
    }

    async saveProfile(): Promise<void> {
        if (!this.user) return;

        try {
            // Create updated user object
            const updatedUser: UserModel = {
                ...this.user,
                name: this.profileForm.value.name,
            };

            // Update the profile
            await this.userService.updateUserProfile(updatedUser);

            this.notyf.success('Profile updated successfully');
            this.isEditing = false;
        } catch (error: any) {
            this.notyf.error(error.message);
        }
    }
}