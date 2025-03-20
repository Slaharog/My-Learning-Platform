import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CourseModel } from '../../../models/course.model';
import { LessonModel } from '../../../models/lesson.model';
import { AuthService } from '../../../services/auth.service';
import { CourseService } from '../../../services/course.service';
import { LessonService } from '../../../services/lesson.service';
import { NotifyService } from '../../../services/notify.service';
import { EnrollmentService } from '../../../services/enrollment.service';
import { CourseProgressComponent } from "../course-progress/course-progress.component";
import { CourseEnrollmentComponent } from "../course-enrollment/course-enrollment.component";
import { ProgressService } from '../../../services/progress.service';

@Component({
    selector: 'app-course-details',
    standalone: true,
    imports: [
        CommonModule, 
        ReactiveFormsModule, 
        RouterModule, 
        CourseProgressComponent, 
        CourseEnrollmentComponent
    ],
    templateUrl: './course-details.component.html',
    styleUrl: './course-details.component.css'
})
export class CourseDetailsComponent implements OnInit {
    courseId: string;
    course: CourseModel = null;
    lessons: LessonModel[] = [];
    isEnrolled = false;
    isLoading = true;
    courseProgress: any = {
        percentComplete: 0,
        completedLessons: 0,
        totalLessons: 0
      };
      lessonProgressData: any[] = [];

    constructor(
        private courseService: CourseService,
        private lessonService: LessonService,
        private authService: AuthService,
        private route: ActivatedRoute,
        private router: Router,
        private notifyService: NotifyService,
        private enrollmentService: EnrollmentService,
        private progressService: ProgressService
    ) { }

    async ngOnInit() {
        try {
            // Get courseId from route parameters
            this.route.params.subscribe(async params => {
                this.courseId = params['courseId'];

                if (!this.courseId) {
                    this.notifyService.error("Course ID is missing");
                    this.router.navigate(['/courses']);
                    return;
                }

                await this.loadCourse();
                await this.loadLessons();

                // Only check enrollment if the user is logged in
                if (this.authService.isAuthenticated()) {
                    await this.checkEnrollment();
                }
                
                
                this.isLoading = false;
            });
        } catch (error) {
            console.error("Error in initialization:", error);
            this.notifyService.error("Failed to load course details");
            this.isLoading = false;
        }
    }

    async loadCourseProgress() {
        if (!this.isEnrolled || !this.courseId) return;
        
        try {
          // Get lessons first if not already loaded
          if (!this.lessons || this.lessons.length === 0) {
            await this.loadLessons();
          }
          
          // Calculate progress
          const progress = await this.progressService.calculateCourseProgress(
            this.courseId, 
            this.lessons
          );
          
          this.courseProgress = {
            percentComplete: progress.percentComplete,
            completedLessons: progress.completedLessons,
            totalLessons: progress.totalLessons
          };
          
          // Map lessons with their completion status
          this.lessonProgressData = this.lessons.map(lesson => {
            const lessonProgress = progress.lessons.find(l => l.lessonId === lesson.lessonId);
            return {
              ...lesson,
              completed: lessonProgress?.completed || false
            };
          });
        } catch (error) {
          console.error('Failed to load course progress:', error);
        }
      }

    async loadCourse() {
        try {
            this.course = await this.courseService.getOneCourse(this.courseId);
        } catch (error) {
            console.error("Failed to load course:", error);
            this.notifyService.error("Failed to load course");
            throw error;
        }
    }

    async loadLessons() {
        try {
            this.lessons = await this.lessonService.getLessonsByCourse(this.courseId);
        } catch (error) {
            console.error("Failed to load lessons:", error);
            this.notifyService.error("Failed to load lessons");
        }
    }

    async checkEnrollment() {
        try {
            if (!this.authService.isAuthenticated()) return;

            // Get enrollments from the enrollment service
            const enrollments = await this.enrollmentService.getUserEnrollments();
            
            // Check if the user is enrolled in this course
            this.isEnrolled = enrollments.some(e => e.courseId === this.courseId);
            
            console.log('Is enrolled in course?', this.isEnrolled);
        } catch (error) {
            console.error("Error checking enrollment:", error);
            // Don't show this error to the user as it's not critical
        }
    }

    updateCourse(): void {
        this.router.navigate(['/courses/edit', this.course.courseId]);
    }

    viewLesson(lessonId: string): void {
        console.log('Navigating to lesson:', lessonId);
        this.router.navigate(['/lessons', lessonId]);
      }
      
      // Method to navigate to lesson edit
      editLesson(lessonId: string): void {
        console.log('Navigating to edit lesson:', lessonId);
        this.router.navigate(['/lessons/edit', lessonId]);
      }
      
      // Method to navigate to add lesson
      addLesson(): void {
        console.log('Navigating to add lesson for course:', this.courseId);
        this.router.navigate(['/lessons/add', this.courseId]);
      }
}