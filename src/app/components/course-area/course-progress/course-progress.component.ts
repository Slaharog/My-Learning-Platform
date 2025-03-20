import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LessonModel } from '../../../models/lesson.model';
import { CourseModel } from '../../../models/course.model';
import { CourseProgress, ProgressService } from '../../../services/progress.service';
import { LessonService } from '../../../services/lesson.service';
import { CourseService } from '../../../services/course.service';
import { NotifyService } from '../../../services/notify.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-course-progress',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course-progress.component.html',
  styleUrls: ['./course-progress.component.css']
})
export class CourseProgressComponent implements OnInit {
    @Input() courseId: string = '';
    
    course: CourseModel | null = null;
    lessons: LessonModel[] = [];
    progress: CourseProgress | null = null;
    loading = false;
    
    constructor(
      private progressService: ProgressService,
      private lessonService: LessonService,
      private courseService: CourseService,
      private notifyService: NotifyService,
      private authService: AuthService
    ) {}
    
    ngOnInit(): void {
      if (this.courseId) {
        this.loadData();
      }
    }
    
    async loadData(): Promise<void> {
      // Check if user is authenticated
      if (!this.authService.isAuthenticated()) {
        this.notifyService.error('Please log in to view progress');
        return;
      }
  
      try {
        this.loading = true;
        
        // Load course details
        this.course = await this.courseService.getOneCourse(this.courseId);
        
        // Load course lessons
        this.lessons = await this.lessonService.getLessonsByCourse(this.courseId);
        
        // Calculate progress
        if (this.course && this.lessons.length > 0) {
          this.progress = await this.progressService.calculateCourseProgress(this.courseId, this.lessons);
        }
      } catch (error) {
        console.error('Error loading course progress:', error);
        this.notifyService.error('Failed to load course progress');
      } finally {
        this.loading = false;
      }
    }
    
    getProgressColorClass(percent: number): string {
      if (percent >= 75) return 'bg-success';
      if (percent >= 50) return 'bg-info';
      if (percent >= 25) return 'bg-warning';
      return 'bg-danger';
    }
  }