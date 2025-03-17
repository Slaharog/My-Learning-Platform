import { computed } from "@angular/core";
import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { UserModel } from "../app/models/user.model";
import { EnrollmentModel } from "../app/models/enrollment.model";
import { ProgressModel } from "../app/models/progress.model";
export type UserState = {
    user: UserModel;
    enrollments: EnrollmentModel[];
    progress: ProgressModel[];
};

const initialState: UserState = {
    user: null,
    enrollments: [],
    progress: []
};

export const UserStore = signalStore(
    { providedIn: "root" }, // Singleton object for DI

    withState(initialState), // Initial state.

    withMethods(store => ({ // Operation we can preform.

        initUser(user: UserModel): void { // Init user in Register or Login
            patchState(store, _currentState => ({ user }));
        },

        logoutUser(): void { // Logout User.
            patchState(store, _currentState => ({ user: null as UserModel }));
        },

        getMyUser(): UserModel | undefined {

            return store.user();
        },

        updateUser(user: UserModel): void {
            patchState(store, _currentState => ({ user }));
        },

        setEnrollments(enrollments: EnrollmentModel[]): void {
            patchState(store, _currentState => ({ enrollments }));
        },

        addEnrollment(enrollment: EnrollmentModel): void {
            patchState(store, currentState => ({
                enrollments: [...currentState.enrollments, enrollment]
            }));
        },

        setProgress(progress: ProgressModel[]): void {
            patchState(store, _currentState => ({ progress }));
        },

        addProgress(progressEntry: ProgressModel): void {
            patchState(store, currentState => ({
                progress: [...currentState.progress, progressEntry]
            }));
        }

    })),

    withComputed(store => ({ 
        userName: computed(() => store.user()?.name),
        userEmail: computed(() => store.user()?.email),
        isLoggedIn: computed(() => !!store.user())
    }))

);

