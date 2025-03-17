import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CourseModel } from '../../../models/course.model';
import { CourseService } from '../../../services/course.service';
import { LessonModel } from '../../../models/lesson.model';
import { LessonService } from '../../../services/lesson.service';
import { NotifyService } from '../../../services/notify.service';
import { LessonListComponent } from '../../lesson-area/lesson-list/lesson-list.component';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule, LessonListComponent, ReactiveFormsModule],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.css'
})
export class CourseDetailsComponent implements OnInit {
    public course: CourseModel | null = null;
    public lessons: LessonModel[] = [];

    constructor(
        private courseService: CourseService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private lessonService: LessonService,
        private notyf: NotifyService
    ) {}

    public async ngOnInit(): Promise<void> {
        try {
            const id: string = this.activatedRoute.snapshot.params["courseId"];
            this.course = await this.courseService.getOneCourse(id);
            this.lessons = await this.lessonService.getLessonsByCourse(id);
        } catch (error: any) {
            this.notyf.error(error.message);
            this.router.navigate(['/courses']);
        }
    }


    public async updateCourse(): Promise<void> {
        if (!this.course) return;
        
        try {
            this.router.navigate(['/courses/edit/', this.course.courseId]);
        } catch (error: any) {
            this.notyf.error(error.message);
        }
    }

    public async addLesson(): Promise<void> {
        try {
            this.router.navigateByUrl(`/lessons/add/${this.course.courseId}`);
        } catch (error: any) {
            this.notyf.error(error.message);
        }
    }

    // public async updateLesson(): Promise<void> {
    //     try {
    //         this.router.navigateByUrl(`/lessons/edit`);
    //     } catch (error: any) {
    //         this.notyf.error(error.message);
    //     }
    // }

    public async deleteCourse(): Promise<void> {
        if (!this.course) return;
        
        if (confirm('Are you sure you want to delete this course?')) {
            try {
                await this.courseService.deleteCourse(this.course.courseId);
                this.notyf.success('Course successfully deleted');
                // Navigate back to courses list after successful deletion
                this.router.navigate(['/courses']);
            } catch (error: any) {
                this.notyf.error(error.message);
            }
        }
    }

    
}