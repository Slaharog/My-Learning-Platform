import { Component, Input, OnInit } from '@angular/core';
import { LessonModel } from '../../../models/lesson.model';
import { CommonModule } from '@angular/common';
import { LessonService } from '../../../services/lesson.service';
import { Router, RouterModule } from '@angular/router';
import { NotifyService } from '../../../services/notify.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LessonDetailsComponent } from "../lesson-details/lesson-details.component";

@Component({
    selector: 'app-lesson-list',
    imports: [CommonModule, RouterModule, ReactiveFormsModule, LessonDetailsComponent],
    templateUrl: './lesson-list.component.html',
    styleUrl: './lesson-list.component.css'
})
export class LessonListComponent implements OnInit {
    @Input() courseId: string;
    @Input() lessons: LessonModel[] = [];
    
    public showAddForm = false;
    public editingLessonId: string | null = null;
  
    constructor(
      private lessonService: LessonService,
      private notyf: NotifyService
    ) {}
  
    ngOnInit(): void {
      if (this.courseId) {
        this.loadLessons();
      }
    }
  
    async loadLessons(): Promise<void> {
      try {
        console.log('Loading lessons for course:', this.courseId);
        this.lessons = await this.lessonService.getLessonsByCourse(this.courseId);
        console.log('Loaded lessons:', this.lessons);
      } catch (error) {
        this.notyf.error('Failed to load lessons');
        console.error('Error loading lessons:', error);
      }
    }
  
    editLesson(lessonId: string): void {
      this.editingLessonId = lessonId;
      this.showAddForm = false;
    }
  
    async deleteLesson(lessonId: string): Promise<void> {
      if (!confirm('Are you sure you want to delete this lesson?')) return;
      
      try {
        await this.lessonService.deleteLesson(lessonId);
        this.notyf.success('Lesson deleted successfully');
        await this.loadLessons();
      } catch (error: any) {
        this.notyf.error('Failed to delete lesson');
        console.error('Error deleting lesson:', error);
      }
    }
  
    async handleLessonSaved(): Promise<void> {
      // Refresh the lessons list
      await this.loadLessons();
      
      // Reset UI state
      this.showAddForm = false;
      this.editingLessonId = null;
    }
  }