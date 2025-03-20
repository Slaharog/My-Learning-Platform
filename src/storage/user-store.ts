import { computed } from "@angular/core";
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { UserModel } from "../app/models/user.model";
import { EnrollmentModel } from "../app/models/enrollment.model";
import { ProgressModel } from "../app/models/progress.model";

export type UserState = {
    user: UserModel | null;
    enrollments: EnrollmentModel[];
    progress: ProgressModel[];
    // Map to associate lessons with courses for easier lookup
    lessonCourseMap: { [lessonId: string]: string };
};

const initialState: UserState = {
    user: null,
    enrollments: [],
    progress: [],
    lessonCourseMap: {}
};

export const UserStore = signalStore(
    { providedIn: "root" }, // Singleton object for DI

    withState(initialState), // Initial state

    withMethods(store => ({ // Operations we can perform

        // User methods
        initUser(user: UserModel): void {
            console.log('Initializing user in UserStore:', user);
            patchState(store, _currentState => ({ user }));
        },

        logoutUser(): void {
            console.log('Logging out user from UserStore');
            patchState(store, _currentState => ({ 
                user: null as UserModel
            }));
        },

        getMyUser(): UserModel | null {
            return store.user();
        },

        updateUser(user: UserModel): void {
            console.log('Updating user in UserStore:', user);
            patchState(store, _currentState => ({ user }));
        },

        // Enrollment methods
        setEnrollments(enrollments: EnrollmentModel[]): void {
            console.log('Setting enrollments in UserStore:', enrollments);
            patchState(store, _currentState => ({ enrollments }));
        },

        addEnrollment(enrollment: EnrollmentModel): void {
            console.log('Adding enrollment to UserStore:', enrollment);
            patchState(store, currentState => ({
                enrollments: [...currentState.enrollments, enrollment]
            }));
        },
        
        removeEnrollment(enrollmentId: string): void {
            console.log('Removing enrollment from UserStore:', enrollmentId);
            patchState(store, currentState => ({
                enrollments: currentState.enrollments.filter(e => e.enrollmentId !== enrollmentId)
            }));
        },

        // Progress methods
        setProgress(progress: ProgressModel[]): void {
            console.log('Setting progress in UserStore:', progress.length, 'records');
            patchState(store, _currentState => ({ progress }));
        },

        addProgress(progressEntry: ProgressModel): void {
            console.log('Adding progress to UserStore:', progressEntry);
            
            // First check if we already have this progress entry
            const existingIndex = store.progress().findIndex(
                p => p.lessonId === progressEntry.lessonId && p.userId === progressEntry.userId
            );
            
            if (existingIndex >= 0) {
                // Update existing entry
                const updatedProgress = [...store.progress()];
                updatedProgress[existingIndex] = progressEntry;
                
                patchState(store, _currentState => ({
                    progress: updatedProgress
                }));
            } else {
                // Add new entry
                patchState(store, currentState => ({
                    progress: [...currentState.progress, progressEntry]
                }));
            }
        },
        
        removeProgress(progressId: string): void {
            console.log('Removing progress from UserStore:', progressId);
            patchState(store, currentState => ({
                progress: currentState.progress.filter(p => p.progressId !== progressId)
            }));
        },
        
        // Lesson-Course mapping methods
        updateLessonCourseMap(lessonId: string, courseId: string): void {
            console.log(`Mapping lesson ${lessonId} to course ${courseId}`);
            patchState(store, currentState => {
                const updatedMap = { ...currentState.lessonCourseMap };
                updatedMap[lessonId] = courseId;
                return { lessonCourseMap: updatedMap };
            });
        },
        
        updateLessonCourseMaps(lessonCourseMap: { [lessonId: string]: string }): void {
            console.log('Updating lesson-course mappings:', Object.keys(lessonCourseMap).length, 'entries');
            patchState(store, currentState => {
                // Merge the new map with existing one
                return { 
                    lessonCourseMap: { 
                        ...currentState.lessonCourseMap, 
                        ...lessonCourseMap 
                    } 
                };
            });
        },
        
        // Clear progress for a course without relying on courseId in progress
        clearCourseProgress(courseId: string): void {
            console.log('Clearing progress for course from UserStore:', courseId);
            
            // Get all lesson IDs for this course from the mapping
            const courseMap = store.lessonCourseMap();
            const lessonsToRemove = Object.entries(courseMap)
                .filter(([_, cId]) => cId === courseId)
                .map(([lessonId, _]) => lessonId);
                
            console.log('Removing progress for lessons:', lessonsToRemove);
            
            // Remove progress entries for these lessons
            patchState(store, currentState => ({
                progress: currentState.progress.filter(p => !lessonsToRemove.includes(p.lessonId))
            }));
        },
        
        // Get course ID for a lesson
        getLessonCourseId(lessonId: string): string | null {
            return store.lessonCourseMap()[lessonId] || null;
        }
    })),

    withComputed(store => ({ 
        userName: computed(() => store.user()?.name),
        userEmail: computed(() => store.user()?.email),
        isLoggedIn: computed(() => !!store.user()),
        enrollmentCount: computed(() => store.enrollments().length),
        progressCount: computed(() => store.progress().length)
    }))
);