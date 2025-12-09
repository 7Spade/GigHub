# Passport Module Agent Guide

The Passport module handles all authentication and user onboarding flows for GigHub using Firebase Authentication (@angular/fire/auth).

## Module Purpose

The Passport module provides:
- **Login** - Email/password and social authentication (Google, GitHub)
- **Registration** - New user signup with email verification
- **Password Reset** - Forgot password flow
- **Lock Screen** - Session lock for security
- **Registration Result** - Post-registration confirmation
- **Firebase Auth Integration** - Using @angular/fire/auth

## Module Structure

```
src/app/routes/passport/
├── AGENTS.md                           # This file
├── routes.ts                           # Module routing
├── callback.component.ts               # OAuth callback handler
├── login/                              # Login flow
│   ├── login.component.ts              # Login form
│   ├── login.component.html            # Login template
│   └── login.component.scss            # Login styles
├── register/                           # Registration flow
│   ├── register.component.ts           # Registration form
│   ├── register.component.html         # Registration template
│   └── register.component.scss         # Registration styles
├── register-result/                    # Post-registration page
│   ├── register-result.component.ts    # Success page
│   └── register-result.component.html  # Success template
└── lock/                               # Lock screen
    ├── lock.component.ts               # Lock form
    └── lock.component.html             # Lock template
```

## Authentication Strategy

GigHub uses **Firebase Authentication** (@angular/fire/auth) as the primary identity provider:

**Supported Methods**:
- **Email/Password** - Traditional authentication
- **Google OAuth** - Google account login
- **GitHub OAuth** (optional) - GitHub account login
- **Email Link** (optional) - Passwordless authentication

**Firebase Auth Flow**:
```
1. User submits credentials
   ↓
2. Firebase Auth validates
   ↓
3. Firebase returns ID token
   ↓
4. Token stored in FirebaseAuth service
   ↓
5. Redirect to dashboard/return URL
   ↓
6. Token auto-refreshes (Firebase SDK handles this)
```

## Login Component

### Purpose

Authenticate users and redirect to application

**File**: `login/login.component.ts`

### Features

- **Email/Password Login** - Traditional authentication
- **Social Login** - Google/GitHub OAuth
- **Remember Me** - Persistent session
- **Forgot Password Link** - Password reset flow
- **Registration Link** - Navigate to signup
- **Return URL** - Redirect after login

### Implementation

```typescript
import { Component, signal, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SHARED_IMPORTS } from '@shared';
import { FirebaseAuthService } from '@core/services/firebase-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private message = inject(NzMessageService);
  
  // State
  loading = signal(false);
  socialLoading = signal<'google' | 'github' | null>(null);
  
  // Form
  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });
  
  // Return URL from query params
  get returnUrl(): string {
    return this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }
  
  async submit(): Promise<void> {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }
    
    this.loading.set(true);
    
    try {
      const { email, password, rememberMe } = this.form.value;
      
      // Firebase email/password login
      await this.authService.signIn(email, password);
      
      // Handle remember me
      if (rememberMe) {
        // Firebase handles persistence automatically
        // You can configure persistence level in FirebaseAuthService
      }
      
      this.message.success('Login successful');
      await this.router.navigate([this.returnUrl]);
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Handle Firebase errors
      if (error.code === 'auth/user-not-found') {
        this.message.error('User not found');
      } else if (error.code === 'auth/wrong-password') {
        this.message.error('Incorrect password');
      } else if (error.code === 'auth/too-many-requests') {
        this.message.error('Too many failed attempts. Please try again later.');
      } else {
        this.message.error('Login failed. Please try again.');
      }
    } finally {
      this.loading.set(false);
    }
  }
  
  async loginWithGoogle(): Promise<void> {
    this.socialLoading.set('google');
    
    try {
      await this.authService.signInWithGoogle();
      this.message.success('Login successful');
      await this.router.navigate([this.returnUrl]);
    } catch (error: any) {
      console.error('Google login failed:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        this.message.warning('Login cancelled');
      } else {
        this.message.error('Google login failed');
      }
    } finally {
      this.socialLoading.set(null);
    }
  }
  
  async loginWithGithub(): Promise<void> {
    this.socialLoading.set('github');
    
    try {
      await this.authService.signInWithGithub();
      this.message.success('Login successful');
      await this.router.navigate([this.returnUrl]);
    } catch (error: any) {
      console.error('GitHub login failed:', error);
      this.message.error('GitHub login failed');
    } finally {
      this.socialLoading.set(null);
    }
  }
  
  navigateToRegister(): void {
    this.router.navigate(['/passport/register'], {
      queryParams: { returnUrl: this.returnUrl }
    });
  }
  
  navigateToForgotPassword(): void {
    this.router.navigate(['/passport/forgot-password']);
  }
}
```

### Template

```html
<div class="login-container">
  <div class="login-card">
    <!-- Logo & Title -->
    <div class="login-header">
      <img src="assets/logo.svg" alt="GigHub" class="logo">
      <h1>Welcome to GigHub</h1>
      <p>工地施工進度追蹤管理系統</p>
    </div>
    
    <!-- Login Form -->
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <!-- Email -->
      <nz-form-item>
        <nz-form-control nzErrorTip="Please input valid email">
          <nz-input-group nzPrefixIcon="mail">
            <input
              nz-input
              formControlName="email"
              type="email"
              placeholder="Email address"
              autocomplete="email" />
          </nz-input-group>
        </nz-form-control>
      </nz-form-item>
      
      <!-- Password -->
      <nz-form-item>
        <nz-form-control nzErrorTip="Password must be at least 6 characters">
          <nz-input-group nzPrefixIcon="lock">
            <input
              nz-input
              formControlName="password"
              type="password"
              placeholder="Password"
              autocomplete="current-password" />
          </nz-input-group>
        </nz-form-control>
      </nz-form-item>
      
      <!-- Remember Me & Forgot Password -->
      <div class="login-options">
        <label nz-checkbox formControlName="rememberMe">
          Remember me
        </label>
        <a (click)="navigateToForgotPassword()">Forgot password?</a>
      </div>
      
      <!-- Submit Button -->
      <button
        nz-button
        nzType="primary"
        nzBlock
        nzSize="large"
        [nzLoading]="loading()"
        [disabled]="form.invalid">
        Login
      </button>
    </form>
    
    <!-- Social Login -->
    <nz-divider nzText="Or login with"></nz-divider>
    
    <div class="social-buttons">
      <button
        nz-button
        nzBlock
        nzSize="large"
        [nzLoading]="socialLoading() === 'google'"
        (click)="loginWithGoogle()">
        <span nz-icon nzType="google"></span>
        Google
      </button>
      
      <button
        nz-button
        nzBlock
        nzSize="large"
        [nzLoading]="socialLoading() === 'github'"
        (click)="loginWithGithub()">
        <span nz-icon nzType="github"></span>
        GitHub
      </button>
    </div>
    
    <!-- Register Link -->
    <div class="register-link">
      Don't have an account?
      <a (click)="navigateToRegister()">Register now</a>
    </div>
  </div>
</div>
```

## Register Component

### Purpose

Create new user accounts with Firebase Authentication

**File**: `register/register.component.ts`

### Features

- **Email Verification** - Sends verification email after registration
- **Password Strength** - Validates password complexity
- **Terms & Conditions** - Checkbox for agreement
- **User Profile** - Display name and optional fields
- **Social Registration** - Google/GitHub account creation

### Implementation

```typescript
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);
  private message = inject(NzMessageService);
  
  loading = signal(false);
  
  form: FormGroup = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      this.passwordStrengthValidator()
    ]],
    confirmPassword: ['', [Validators.required]],
    agreeToTerms: [false, [Validators.requiredTrue]]
  }, {
    validators: this.passwordMatchValidator
  });
  
  passwordStrengthValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;
      
      return !passwordValid ? { passwordStrength: true } : null;
    };
  }
  
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
  
  async submit(): Promise<void> {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }
    
    this.loading.set(true);
    
    try {
      const { displayName, email, password } = this.form.value;
      
      // Create user with Firebase
      await this.authService.signUp(email, password, displayName);
      
      // Send email verification
      await this.authService.sendEmailVerification();
      
      this.message.success('Registration successful! Please check your email.');
      
      // Navigate to registration result page
      await this.router.navigate(['/passport/register-result'], {
        queryParams: { email }
      });
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        this.message.error('Email already registered');
      } else if (error.code === 'auth/weak-password') {
        this.message.error('Password is too weak');
      } else {
        this.message.error('Registration failed. Please try again.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
```

## Lock Screen Component

### Purpose

Lock the current session for security

**File**: `lock/lock.component.ts`

### Features

- **Session Lock** - Requires password to unlock
- **User Avatar** - Shows current user
- **Auto-lock** - After period of inactivity
- **Unlock Animation** - Smooth transition

### Implementation

```typescript
@Component({
  selector: 'app-lock',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="lock-container">
      <nz-avatar
        [nzSize]="128"
        [nzSrc]="userAvatar()"
        [nzText]="userInitial()" />
      
      <h2>{{ userName() }}</h2>
      <p>Enter your password to unlock</p>
      
      <form [formGroup]="form" (ngSubmit)="unlock()">
        <nz-form-item>
          <nz-form-control>
            <nz-input-group nzPrefixIcon="lock">
              <input
                nz-input
                formControlName="password"
                type="password"
                placeholder="Password"
                appAutoFocus />
            </nz-input-group>
          </nz-form-control>
        </nz-form-item>
        
        <button
          nz-button
          nzType="primary"
          nzBlock
          [nzLoading]="loading()">
          Unlock
        </button>
      </form>
      
      <a (click)="logout()">Login as different user</a>
    </div>
  `
})
export class LockComponent {
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);
  private message = inject(NzMessageService);
  
  loading = signal(false);
  
  form = inject(FormBuilder).group({
    password: ['', Validators.required]
  });
  
  userName = computed(() => {
    return this.authService.currentUser?.displayName || 'User';
  });
  
  userAvatar = computed(() => {
    return this.authService.currentUser?.photoURL || '';
  });
  
  userInitial = computed(() => {
    return this.userName().charAt(0).toUpperCase();
  });
  
  async unlock(): Promise<void> {
    if (this.form.invalid) return;
    
    this.loading.set(true);
    
    try {
      const { password } = this.form.value;
      const email = this.authService.currentUser?.email;
      
      if (!email) throw new Error('No email');
      
      // Re-authenticate with Firebase
      await this.authService.signIn(email, password);
      
      this.message.success('Unlocked successfully');
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.message.error('Incorrect password');
    } finally {
      this.loading.set(false);
    }
  }
  
  async logout(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigate(['/passport/login']);
  }
}
```

## Firebase Auth Service

### Core Service

**File**: `@core/services/firebase-auth.service.ts`

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  
  // Current user as signal
  currentUserSignal = signal<User | null>(null);
  
  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSignal.set(user);
    });
  }
  
  get currentUser(): User | null {
    return this.auth.currentUser;
  }
  
  // Email/Password Authentication
  async signIn(email: string, password: string): Promise<User> {
    const { user } = await signInWithEmailAndPassword(this.auth, email, password);
    return user;
  }
  
  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    const { user } = await createUserWithEmailAndPassword(this.auth, email, password);
    
    // Update profile with display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    return user;
  }
  
  async signOut(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/passport/login']);
  }
  
  // Social Authentication
  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(this.auth, provider);
    return user;
  }
  
  async signInWithGithub(): Promise<User> {
    const provider = new GithubAuthProvider();
    const { user } = await signInWithPopup(this.auth, provider);
    return user;
  }
  
  // Email Verification
  async sendEmailVerification(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
    }
  }
  
  // Password Reset
  async sendPasswordResetEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }
  
  // Utility
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
  
  isEmailVerified(): boolean {
    return this.currentUser?.emailVerified || false;
  }
}
```

## Route Guards

### Auth Guard

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { FirebaseAuthService } from '@core/services/firebase-auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(FirebaseAuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // Redirect to login with return URL
  return router.createUrlTree(['/passport/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

### Guest Guard (Prevent authenticated users from accessing login)

```typescript
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(FirebaseAuthService);
  const router = inject(Router);
  
  if (!authService.isAuthenticated()) {
    return true;
  }
  
  // Already logged in, redirect to dashboard
  return router.createUrlTree(['/dashboard']);
};
```

## Routing Configuration

```typescript
// routes.ts
export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    data: { title: 'Login' }
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard],
    data: { title: 'Register' }
  },
  {
    path: 'register-result',
    component: RegisterResultComponent,
    data: { title: 'Registration Successful' }
  },
  {
    path: 'lock',
    component: LockComponent,
    canActivate: [authGuard],
    data: { title: 'Lock Screen' }
  },
  {
    path: 'callback',
    component: CallbackComponent,
    data: { title: 'Authenticating...' }
  }
];
```

## Best Practices

1. **Security**
   - Never store passwords in plaintext
   - Use Firebase's secure authentication
   - Implement email verification
   - Enforce strong password policies
   - Use HTTPS only

2. **User Experience**
   - Show clear error messages
   - Provide loading states
   - Remember return URLs
   - Auto-focus input fields
   - Support keyboard navigation

3. **Firebase Integration**
   - Handle all Firebase error codes
   - Use Firebase Auth state listeners
   - Implement proper token refresh
   - Configure Firebase persistence

4. **Testing**
   - Mock Firebase Auth in tests
   - Test error scenarios
   - Verify guard behavior
   - Test social login flows

## Troubleshooting

**Issue**: Login fails with "auth/operation-not-allowed"  
**Solution**: Enable Email/Password authentication in Firebase Console

**Issue**: Google login popup blocked  
**Solution**: Use `signInWithRedirect()` instead of `signInWithPopup()`

**Issue**: Email verification not sent  
**Solution**: Check Firebase email templates configuration

**Issue**: Token expired errors  
**Solution**: Firebase SDK auto-refreshes tokens, ensure proper error handling

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application bootstrap
- **[Core Services](../../core/AGENTS.md)** - Auth service
- **[Firebase Auth Docs](https://firebase.google.com/docs/auth/web/start)** - Official documentation

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
