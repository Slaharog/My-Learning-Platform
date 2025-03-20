import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { UserModel } from '../models/user.model';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { NotifyService } from './notify.service';
import { UserStore } from '../../storage/user-store';

interface TokenPayload {
    user: string;
    exp: number;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject: BehaviorSubject<UserModel | null>;
    public currentUser$: Observable<UserModel | null>;
    private isAuthenticatedSubject: BehaviorSubject<boolean>;
    public isAuthenticated$: Observable<boolean>;

    private readonly TOKEN_KEY = 'token';
    private userStore = inject(UserStore);
    constructor(
        private http: HttpClient,
        private router: Router,
        private notifyService: NotifyService,

    ) {
        this.currentUserSubject = new BehaviorSubject<UserModel | null>(this.getUserFromToken());
        this.currentUser$ = this.currentUserSubject.asObservable();
        this.isAuthenticatedSubject = new BehaviorSubject<boolean>(!!this.getValidToken());
        this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
        this.currentUser$.subscribe(user => {
            if (user) {
                this.userStore.initUser(user);
            }
        });
    }

    public isAuthenticated(): boolean {
        return this.isAuthenticatedSubject.value;
    }

    public getCurrentUser(): UserModel | null {
        return this.currentUserSubject.value;
    }

    public getCurrentUserId(): string {
        try {
            // First try from the current user subject
            const user = this.currentUserSubject.value;
            if (user && user.id) {
                return user.id;
            }

            // If that fails, try from UserStore
            const storeUser = this.userStore.getMyUser();
            if (storeUser && storeUser.id) {
                return storeUser.id;
            }

            // If still no ID, try from the token
            const token = this.getToken();
            if (!token) {
                return '';
            }

            // Decode the token
            const decoded = jwtDecode<TokenPayload>(token);
            if (!decoded || !decoded.user) {
                return '';
            }

            // Parse the user from the token payload
            const userFromToken = JSON.parse(decoded.user);

            // Check different possible ID field names
            if (userFromToken.id) {
                return userFromToken.id;
            }
            if (userFromToken.userId) {
                return userFromToken.userId;
            }
            if (userFromToken.UserId) {
                return userFromToken.UserId;
            }
            return '';
        } catch (error) {
            console.error('Error getting user ID:', error);
            return '';
        }
    }

    public getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private getValidToken(): string | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const decoded = jwtDecode<TokenPayload>(token);

            // Check if token is expired
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                this.logout();
                return null;
            }
            return token;
        } catch (error) {
            console.error('Invalid token:', error);
            this.logout();
            return null;
        }
    }

    private getUserFromToken(): UserModel | null {
        const token = this.getToken();
        if (!token) return null;
        try {
            const decoded = jwtDecode<TokenPayload>(token);

            // Check if token is expired
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                this.logout();
                return null;
            }

            // Parse user from token
            const userJson = decoded.user;
            const user = userJson ? JSON.parse(userJson) : null;
            return user;
        } catch (error) {
            console.error('Error decoding token:', error);
            this.logout();
            return null;
        }
    }

    public async login(email: string, password: string): Promise<void> {
        try {
            const response$ = this.http.post<{ token: string }>(environment.loginUrl, { email, password });
            const response = await firstValueFrom(response$);

            // Save token
            localStorage.setItem(this.TOKEN_KEY, response.token);

            // Decode user from token
            const user = this.getUserFromToken();

            // Update state
            this.currentUserSubject.next(user);
            this.isAuthenticatedSubject.next(true);

            // Update store
            if (user) {
                this.userStore.initUser(user);
            }

            this.notifyService.success('Login successful');
        } catch (error) {
            console.error('Login error:', error);
            this.notifyService.error('Login failed. Please check your credentials.');
            throw error;
        }
    }

    public async register(user: UserModel): Promise<void> {
        try {
            const response$ = this.http.post<{ token: string }>(environment.registerUrl, user);
            const response = await firstValueFrom(response$);

            // Save token
            localStorage.setItem(this.TOKEN_KEY, response.token);

            // Decode user from token
            const newUser = this.getUserFromToken();

            // Update state
            this.currentUserSubject.next(newUser);
            this.isAuthenticatedSubject.next(true);

            // Update store
            if (newUser) {
                this.userStore.initUser(newUser);
            }

            this.notifyService.success('Registration successful');
        } catch (error) {
            console.error('Registration error:', error);
            this.notifyService.error('Registration failed. Please try again.');
            throw error;
        }
    }

    public logout(): void {
        // Remove token
        localStorage.removeItem(this.TOKEN_KEY);

        // Update state
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);

        // Update store
        this.userStore.logoutUser();

        // Navigate to login
        this.router.navigate(['/login']);

        this.notifyService.success('Logged out successfully');
    }
}