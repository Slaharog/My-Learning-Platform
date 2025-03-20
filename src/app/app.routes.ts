import { Routes } from '@angular/router';
import { HomeComponent } from './components/page-area/home/home.component';
import { Page404Component } from './components/page-area/page404/page404.component';
import { CourseListComponent } from './components/course-area/course-list/course-list.component';
import { CourseDetailsComponent } from './components/course-area/course-details/course-details.component';
import { LessonListComponent } from './components/lesson-area/lesson-list/lesson-list.component';
import { UpdateCourseComponent } from './components/course-area/update-course/update-course.component';
import { AddCourseComponent } from './components/course-area/add-course/add-course.component';
import { LessonDetailsComponent } from './components/lesson-area/lesson-details/lesson-details.component';
import { UserDetailsComponent } from './components/user-area/user-details/user-details.component';
import { LoginComponent } from './components/user-area/login/login.component';
import { RegisterComponent } from './components/user-area/register/register.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
    // Public Routes
    { path: "", redirectTo: "home", pathMatch: "full" },
    { path: "home", component: HomeComponent },
    { path: "register", loadComponent: () => import("./components/user-area/register/register.component").then(m => m.RegisterComponent) }, // Lazy Loading
    { path: "login", loadComponent: () => import("./components/user-area/login/login.component").then(m => m.LoginComponent) },
    // Protected Routes
    {
        path: "courses",
        component: CourseListComponent,
        canActivate: [authGuard]
    },
    {
        path: "courses/add",
        component: AddCourseComponent,
        canActivate: [authGuard]
    },
    {
        path: "courses/:courseId",
        component: CourseDetailsComponent,
        canActivate: [authGuard]
    },
    {
        path: "courses/:courseId/lessons/:lessonId",
        component: CourseDetailsComponent,
        canActivate: [authGuard]
    },
    {
        path: "courses/:courseId/lessons/add",
        component: LessonDetailsComponent,
        canActivate: [authGuard]
    },
    {
        path: "courses/edit/:courseId",
        component: UpdateCourseComponent,
        canActivate: [authGuard]
    },
    {
        path: "lessons/add/:courseId",
        component: LessonDetailsComponent,
        canActivate: [authGuard]
    },
    {
        path: "lessons/edit/:lessonId",
        component: LessonDetailsComponent,
        canActivate: [authGuard]
    },
    {
        path: "lessons/:lessonId",
        component: LessonDetailsComponent,
        canActivate: [authGuard]
    },
    {
        path: "users",
        component: UserDetailsComponent,
        canActivate: [authGuard]
    },
    {
        path: "courses/:courseId/lessons/detail/:lessonId", 
        component: LessonDetailsComponent, 
        canActivate: [authGuard]
    },
    {
        path: "courses/:courseId/lessons/edit/:lessonId", 
        component: LessonDetailsComponent, 
        canActivate: [authGuard]
    },
    { path: "**", component: Page404Component }
];

// export const routes: Routes = [
//     { path: "", redirectTo: "home", pathMatch: "full" },
//     { path: "home", component: HomeComponent },
//     { path: "courses", component: CourseListComponent },
//     { path: "courses/add", component: AddCourseComponent },
//     { path: "courses/:courseId", component: CourseDetailsComponent },
//     { path: "courses/edit/:courseId", component: UpdateCourseComponent },
//     { path: "lessons", component: LessonListComponent },
//     { path: "lessons/edit/:lessonId", component: LessonDetailsComponent },
//     { path: "lessons/add/:courseId", component: LessonDetailsComponent },
//     { path: "register", loadComponent: () => import("./components/user-area/register/register.component").then(m => m.RegisterComponent) }, // Lazy Loading
//     { path: "login", loadComponent: () => import("./components/user-area/login/login.component").then(m => m.LoginComponent) },
//     { path: "users", component: UserDetailsComponent },


//     { path: "**", component: Page404Component }
// ];


// export const routes: Routes = [
//     { path: "", redirectTo: "courses", pathMatch: "full" },
//     { path: "home", component: HomeComponent },
//     { path: "courses", component: CourseListComponent },
//     { path: "courses/add", component: AddCourseComponent },
//     { path: "courses/:courseId", component: CourseDetailsComponent },
//     { path: "courses/:courseId/lessons/:lessonId", component: CourseDetailsComponent },
//     { path: 'courses/:courseId/lessons/add', component: LessonDetailsComponent },
//     { path: "courses/edit/:courseId", component: UpdateCourseComponent },
//     { path: "lessons/add/:courseId", component: LessonDetailsComponent },
//     { path: "lessons/edit/:lessonId", component: LessonDetailsComponent },
//     { path: "lessons/:lessonId", component: LessonDetailsComponent },
//     { path: "login", component: LoginComponent },
//     { path: "register", component: RegisterComponent },
//     { path: "users", component: UserDetailsComponent, canActivate: [authGuard] },
//     { path: "**", component: Page404Component }
// ];


