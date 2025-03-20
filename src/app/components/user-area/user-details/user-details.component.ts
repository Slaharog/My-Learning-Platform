import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserStore } from '../../../../storage/user-store';
import { UserService } from '../../../services/user.service';
import { CourseService } from '../../../services/course.service';
import { ProgressService } from '../../../services/progress.service';
import { LessonService } from '../../../services/lesson.service';
import { AuthService } from '../../../services/auth.service';
import { UserModel } from '../../../models/user.model';
import { CourseModel } from '../../../models/course.model';
import { ProgressModel } from '../../../models/progress.model';
import { LessonModel } from '../../../models/lesson.model';
import { StatusBadgeComponent } from "../../page-area/status-badge/status-badge.component";
import { ProgressBarComponent } from "../../page-area/progress-bar/progress-bar.component";

interface CourseProgressData {
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
}

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, ProgressBarComponent],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent implements OnInit {
  // Dependencies
  private userStore = inject(UserStore);
  private userService = inject(UserService);
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  private lessonService = inject(LessonService);
  private authService = inject(AuthService);

  // Component state
  user: UserModel | null = null;
  enrolledCourses: CourseModel[] = [];
  progress: ProgressModel[] = [];
  lessons: { [courseId: string]: LessonModel[] } = {};
  courseProgress: { [courseId: string]: CourseProgressData } = {};
  isLoading = true;
  activeTab: 'profile' | 'courses' | 'progress' = 'profile';
  completedLessonsCount = 0;
  averageProgress = 0;

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.isLoading = false;
      return;
    }

    this.loadAllUserData();
  }

  async loadAllUserData(): Promise<void> {
    try {
      // Load user data
      this.user = await this.userService.getMyUser();
      
      // Load enrolled courses
      this.enrolledCourses = await this.courseService.getUserEnrolledCourses();
      
      // Load progress data and lessons for each course
      await this.loadProgressData();
      
      // Calculate statistics
      this.calculateStatistics();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadProgressData(): Promise<void> {
    try {
      // Load all user progress
      this.progress = await this.userService.getProgress();
      
      // Get lessons for each enrolled course
      for (const course of this.enrolledCourses) {
        this.lessons[course.courseId] = await this.lessonService.getLessonsByCourse(course.courseId);
        
        // Calculate course progress
        const completedLessons = this.progress.filter(p => 
          this.lessons[course.courseId].some(l => l.lessonId === p.lessonId)
        ).length;
        
        const totalLessons = this.lessons[course.courseId].length;
        const percentComplete = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100) 
          : 0;
        
        this.courseProgress[course.courseId] = {
          courseId: course.courseId,
          completedLessons,
          totalLessons,
          percentComplete
        };
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  }

  calculateStatistics(): void {
    // Calculate total completed lessons
    this.completedLessonsCount = Object.values(this.courseProgress)
      .reduce((total, course) => total + course.completedLessons, 0);
      
    // Calculate average progress across all courses
    if (this.enrolledCourses.length > 0) {
      const totalProgress = Object.values(this.courseProgress)
        .reduce((sum, course) => sum + course.percentComplete, 0);
      
      this.averageProgress = Math.round(totalProgress / this.enrolledCourses.length);
    }
  }
  
  // Tab management
  setActiveTab(tab: 'profile' | 'courses' | 'progress'): void {
    this.activeTab = tab;
  }
  
  // Progress getter methods
  getCourseProgress(courseId: string): number {
    return this.courseProgress[courseId]?.percentComplete || 0;
  }
  
  getCompletedLessonsCount(courseId: string): number {
    return this.courseProgress[courseId]?.completedLessons || 0;
  }
  
  getTotalLessonsCount(courseId: string): number {
    return this.courseProgress[courseId]?.totalLessons || 0;
  }
  
  // Get user initials for avatar
  get userInitials(): string {
    if (!this.user || !this.user.name) return 'U';
    
    const nameParts = this.user.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  getCourseStatus(courseId: string): 'completed' | 'in-progress' | 'not-started' {
    const progress = this.getCourseProgress(courseId);
    
    if (progress === 100) {
      return 'completed';
    } else if (progress > 0) {
      return 'in-progress';
    } else {
      return 'not-started';
    }
  }
  
  // Get recent lessons (completed in the last 30 days)
  getRecentLessons(courseId: string): any[] {
    // Filter progress entries for this course
    const courseProgress = this.progress.filter(p => {
      // Get the lesson
      const lesson = this.findLessonById(p.lessonId);
      // Check if lesson belongs to this course
      return lesson && lesson.courseId === courseId;
    });
    
    // Sort by most recent
    const sortedProgress = courseProgress.sort((a, b) => {
      return new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime();
    });
    
    // Get last 3 activities
    const recentProgress = sortedProgress.slice(0, 3);
    
    // Map to more detailed objects
    return recentProgress.map(p => {
      const lesson = this.findLessonById(p.lessonId);
      return {
        lessonId: p.lessonId,
        lessonTitle: lesson ? lesson.title : 'Unknown Lesson',
        watchedAt: p.watchedAt
      };
    });
  }
  
  // Helper to find a lesson by ID
  findLessonById(lessonId: string): any {
    for (const courseId in this.lessons) {
      const lesson = this.lessons[courseId].find(l => l.lessonId === lessonId);
      if (lesson) return lesson;
    }
    return null;
  }
}