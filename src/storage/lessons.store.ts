import { computed } from "@angular/core";
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { LessonModel } from "../app/models/lesson.model";

export type LessonState = {
    lessons: LessonModel[];
}

const initialState: LessonState = {
    lessons: [],
}

export const LessonStore = signalStore(

    { providedIn: "root" },

    withState(initialState),

    withMethods(store => ({
        initLessons(lessons: LessonModel[]): void {
            patchState(store, _currentState => ({ lessons })); 
        },

        addLesson(lesson: LessonModel): void {
            patchState(store, currentState => ({ lessons: [...currentState.lessons, lesson] })); 
        },

        updateLesson(lesson: LessonModel): void {
            patchState(store, currentState => ({ lessons: [...currentState.lessons.map( l => l.lessonId === lesson.lessonId ? lesson : l)] })); 
        },

        deleteLesson(id: string): void {
            patchState(store, currentState => ({ lessons: currentState.lessons.filter(l => l.lessonId !== id)})); 
        },

        getOneLesson(lessonId: string): LessonModel | undefined {
            return store.lessons().find(l => l.lessonId === lessonId);
        },

        getLessonsByCourse(courseId: string): LessonModel[] | undefined {
            const lessons = store.lessons().filter(l => l.courseId === courseId);
            return lessons;
        }

    })),

    withComputed(store => ({
        count: computed(() => store.lessons().length),
    }))
);