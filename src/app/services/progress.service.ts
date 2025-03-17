import { Injectable, inject } from '@angular/core';
import { UserStore } from '../../storage/user-store';
import { EnrollmentModel } from '../models/enrollment.model';
import { ProgressModel } from '../models/progress.model';
import { CourseStore } from '../../storage/course.store';
import { LessonStore } from '../../storage/lessons.store';

export interface CourseWithProgress {
  courseId: string;
  title: string;
  description: string;
  enrolledAt: Date;
  totalLessons: number;
  completedLessons: number;
  progress: number; // Percentage (0-100)
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private userStore = inject(UserStore);
  private courseStore = inject(CourseStore);
  private lessonStore = inject(LessonStore);
  
  // Get courses with progress information
  getCoursesWithProgress(enrollments: EnrollmentModel[], progress: ProgressModel[]): CourseWithProgress[] {
    if (!enrollments || !enrollments.length) return [];
    
    return enrollments
      .map(enrollment => {
        // Find the course details
        const course = this.courseStore.getOneCourse(enrollment.courseId);
        
        if (!course) return null;
        
        // Find all lessons for this course
        const courseLessons = this.lessonStore.getLessonsByCourse(enrollment.courseId) || [];
        const totalLessons = courseLessons.length;
        
        // Find progress entries for this course
        const courseProgress = progress.filter(p => p.lessonId && 
          courseLessons.some(lesson => lesson.lessonId === p.lessonId));
        
        // Count unique completed lessons
        const completedLessons = new Set(courseProgress.map(p => p.lessonId)).size;
        
        // Calculate progress percentage
        const progressPercentage = totalLessons ? 
          Math.round((completedLessons / totalLessons) * 100) : 0;
        
        return {
          courseId: enrollment.courseId,
          title: course.title,
          description: course.description,
          enrolledAt: enrollment.enrolledAt,
          totalLessons,
          completedLessons,
          progress: progressPercentage
        };
      })
      .filter(Boolean); // Remove any null entries
  }
}