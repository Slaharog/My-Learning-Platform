import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { CourseModel } from "../app/models/course.model";
import { computed } from "@angular/core";

export type CourseState = {
    courses: CourseModel[];
}

const initialState: CourseState = {
    courses: [],
}

export const CourseStore = signalStore(

    { providedIn: "root" },

    withState(initialState),

    withMethods(store => ({
        initCourses(courses: CourseModel[]): void {
            patchState(store, _currentState => ({ courses })); 
        },

        addCourse(course: CourseModel): void {
            patchState(store, currentState => ({ courses: [...currentState.courses, course] })); 
        },

        updateCourse(course: CourseModel): void {
            patchState(store, currentState => ({ courses: [...currentState.courses.map( c => c.courseId === course.courseId ? course : c)] })); 
        },

        deleteCourse(courseId: string): void {
            patchState(store, currentState => ({ courses: currentState.courses.filter(c => c.courseId !== courseId)})); 
        },

        getOneCourse(courseId: string): CourseModel | undefined {
            return store.courses().find(c => c.courseId === courseId);
        }

    })),

    withComputed(store => ({
        count: computed(() => store.courses().length),
    }))
);