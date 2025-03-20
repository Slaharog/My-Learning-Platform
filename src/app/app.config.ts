import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './services/token.interceptor';
import { AuthService } from './services/auth.service';
import { EnrollmentService } from './services/enrollment.service';
import { ProgressService } from './services/progress.service';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(
            withInterceptors([tokenInterceptor])
        ),
        { provide: AuthService, useClass: AuthService },
        { provide: EnrollmentService, useClass: EnrollmentService },
        { provide: ProgressService, useClass: ProgressService },
        { provide: 'ALLOW_INSECURE_LOCALHOST', useValue: true }
    ]
};