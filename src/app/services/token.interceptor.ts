import { HttpInterceptorFn } from '@angular/common/http';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
    // Take token:
    const token = localStorage.getItem("token");

    // authorization: "Bearer the-token"
    const clonedRequest = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });

    return next(clonedRequest);
};
