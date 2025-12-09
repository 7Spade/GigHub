# Exception Module Agent Guide

The Exception module provides standardized error pages for HTTP and application errors in GigHub.

## Module Purpose

The Exception module offers:
- **403 Forbidden** - Access denied page
- **404 Not Found** - Page not found
- **500 Server Error** - Internal server error
- **Trigger Component** - Manual error testing
- **Consistent Design** - ng-zorro-antd Result component
- **User-Friendly Messages** - Clear error communication

## Module Structure

```
src/app/routes/exception/
├── AGENTS.md                    # This file
├── routes.ts                    # Module routing
├── exception.component.ts       # Reusable exception component
└── trigger.component.ts         # Error trigger for testing
```

## Exception Pages

### 403 Forbidden

**Purpose**: Display when user lacks permission for requested resource

**Usage**:
```typescript
// In route guard
if (!hasPermission) {
  return router.createUrlTree(['/exception/403']);
}
```

### 404 Not Found

**Purpose**: Display when requested route/resource doesn't exist

**Usage**:
```typescript
// Catch-all route
{
  path: '**',
  redirectTo: '/exception/404'
}
```

### 500 Server Error

**Purpose**: Display when server encounters an error

**Usage**:
```typescript
// In error interceptor
if (error.status >= 500) {
  router.navigate(['/exception/500']);
}
```

## Exception Component

### Reusable Component

**File**: `exception.component.ts`

```typescript
import { Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';

type ExceptionType = '403' | '404' | '500';

interface ExceptionConfig {
  type: 'success' | 'error' | 'info' | 'warning' | '403' | '404' | '500';
  title: string;
  description: string;
  icon?: string;
}

@Component({
  selector: 'app-exception',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="exception-container">
      <nz-result
        [nzStatus]="config().type"
        [nzTitle]="config().title"
        [nzSubTitle]="config().description"
        [nzIcon]="config().icon">
        
        <div nz-result-extra>
          <button
            nz-button
            nzType="primary"
            nzSize="large"
            (click)="goHome()">
            <span nz-icon nzType="home"></span>
            Back to Home
          </button>
          
          <button
            nz-button
            nzSize="large"
            (click)="goBack()">
            <span nz-icon nzType="arrow-left"></span>
            Go Back
          </button>
        </div>
      </nz-result>
    </div>
  `,
  styles: [`
    .exception-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
  `]
})
export class ExceptionComponent {
  type = input.required<ExceptionType>();
  
  private router = Router;
  
  config = computed((): ExceptionConfig => {
    const configs: Record<ExceptionType, ExceptionConfig> = {
      '403': {
        type: '403',
        title: '403',
        description: 'Sorry, you don\'t have permission to access this page.',
        icon: 'lock'
      },
      '404': {
        type: '404',
        title: '404',
        description: 'Sorry, the page you visited does not exist.',
        icon: 'file-search'
      },
      '500': {
        type: '500',
        title: '500',
        description: 'Sorry, something went wrong on our server.',
        icon: 'close-circle'
      }
    };
    
    return configs[this.type()];
  });
  
  goHome(): void {
    this.router.navigate(['/']);
  }
  
  goBack(): void {
    window.history.back();
  }
}
```

### Usage in Routes

```typescript
// routes.ts
export const routes: Routes = [
  {
    path: '403',
    component: ExceptionComponent,
    data: { type: '403', title: 'Access Denied' }
  },
  {
    path: '404',
    component: ExceptionComponent,
    data: { type: '404', title: 'Not Found' }
  },
  {
    path: '500',
    component: ExceptionComponent,
    data: { type: '500', title: 'Server Error' }
  },
  {
    path: 'trigger',
    component: TriggerComponent,
    data: { title: 'Error Trigger' }
  }
];
```

## Trigger Component

### Development Testing Tool

**Purpose**: Manually trigger errors for testing error handling

**File**: `trigger.component.ts`

```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-trigger',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="trigger-container">
      <nz-card nzTitle="Error Trigger (Development Only)">
        <p>Use these buttons to test error handling and exception pages.</p>
        
        <nz-space nzDirection="vertical" nzSize="large">
          <!-- Navigate to Exception Pages -->
          <button nz-button nzDanger (click)="navigate403()">
            Navigate to 403 Forbidden
          </button>
          
          <button nz-button nzDanger (click)="navigate404()">
            Navigate to 404 Not Found
          </button>
          
          <button nz-button nzDanger (click)="navigate500()">
            Navigate to 500 Server Error
          </button>
          
          <nz-divider />
          
          <!-- Trigger HTTP Errors -->
          <button nz-button (click)="trigger404Http()">
            Trigger 404 HTTP Error
          </button>
          
          <button nz-button (click)="trigger500Http()">
            Trigger 500 HTTP Error
          </button>
          
          <nz-divider />
          
          <!-- Trigger Runtime Errors -->
          <button nz-button (click)="triggerRuntimeError()">
            Trigger Runtime Error
          </button>
          
          <button nz-button (click)="triggerAsyncError()">
            Trigger Async Error
          </button>
        </nz-space>
      </nz-card>
    </div>
  `,
  styles: [`
    .trigger-container {
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }
  `]
})
export class TriggerComponent {
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}
  
  // Navigate to exception pages
  navigate403(): void {
    this.router.navigate(['/exception/403']);
  }
  
  navigate404(): void {
    this.router.navigate(['/exception/404']);
  }
  
  navigate500(): void {
    this.router.navigate(['/exception/500']);
  }
  
  // Trigger HTTP errors
  trigger404Http(): void {
    this.http.get('/api/nonexistent-endpoint').subscribe({
      error: (err) => console.error('404 Error:', err)
    });
  }
  
  trigger500Http(): void {
    this.http.get('/api/error-endpoint').subscribe({
      error: (err) => console.error('500 Error:', err)
    });
  }
  
  // Trigger runtime errors
  triggerRuntimeError(): void {
    throw new Error('Test runtime error');
  }
  
  async triggerAsyncError(): Promise<void> {
    await new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test async error')), 100);
    });
  }
}
```

## Global Error Handler

### Error Handler Service

**File**: `@core/errors/global-error-handler.ts`

```typescript
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LoggerService } from '@core/services/logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggerService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  
  handleError(error: any): void {
    console.error('Global error caught:', error);
    
    // Log error
    this.logger.error('Unhandled error', error);
    
    // Determine error type and navigate
    if (this.isHttpError(error)) {
      this.handleHttpError(error);
    } else if (this.isFirebaseError(error)) {
      this.handleFirebaseError(error);
    } else {
      this.handleGenericError(error);
    }
  }
  
  private isHttpError(error: any): boolean {
    return error?.status !== undefined;
  }
  
  private isFirebaseError(error: any): boolean {
    return error?.code?.startsWith('auth/') || error?.code?.startsWith('firestore/');
  }
  
  private handleHttpError(error: any): void {
    const status = error.status;
    
    if (status === 403) {
      this.message.error('Access denied');
      this.router.navigate(['/exception/403']);
    } else if (status === 404) {
      this.message.error('Resource not found');
      this.router.navigate(['/exception/404']);
    } else if (status >= 500) {
      this.message.error('Server error occurred');
      this.router.navigate(['/exception/500']);
    }
  }
  
  private handleFirebaseError(error: any): void {
    // Handle Firebase-specific errors
    this.message.error('Firebase error: ' + error.message);
  }
  
  private handleGenericError(error: any): void {
    // Show generic error message
    this.message.error('An unexpected error occurred');
    
    // In production, could navigate to 500 page
    if (error?.severity === 'critical') {
      this.router.navigate(['/exception/500']);
    }
  }
}
```

### Register in app.config.ts

```typescript
import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from '@core/errors/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    }
  ]
};
```

## HTTP Error Interceptor

### Error Interceptor

**File**: `@core/interceptors/error.interceptor.ts`

```typescript
import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const message = inject(NzMessageService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle different HTTP errors
      switch (error.status) {
        case 401:
          message.error('Session expired. Please login again.');
          router.navigate(['/passport/login']);
          break;
          
        case 403:
          message.error('You don\'t have permission to access this resource.');
          router.navigate(['/exception/403']);
          break;
          
        case 404:
          message.error('Resource not found.');
          // Don't navigate for 404 - let the component handle it
          break;
          
        case 500:
        case 502:
        case 503:
          message.error('Server error. Please try again later.');
          router.navigate(['/exception/500']);
          break;
          
        default:
          message.error('An error occurred. Please try again.');
      }
      
      return throwError(() => error);
    })
  );
};
```

## Custom Error Classes

### Typed Errors

**File**: `@core/errors/custom-errors.ts`

```typescript
export enum ErrorSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: ErrorSeverity = ErrorSeverity.Medium,
    public recoverable: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class PermissionDeniedError extends AppError {
  constructor(resource: string, action: string) {
    super(
      `Permission denied: Cannot ${action} ${resource}`,
      'PERMISSION_DENIED',
      ErrorSeverity.High,
      false,
      { resource, action }
    );
    this.name = 'PermissionDeniedError';
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resourceType: string, resourceId: string) {
    super(
      `${resourceType} not found: ${resourceId}`,
      'RESOURCE_NOT_FOUND',
      ErrorSeverity.Medium,
      false,
      { resourceType, resourceId }
    );
    this.name = 'ResourceNotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors: Record<string, string[]>
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      ErrorSeverity.Low,
      true,
      { errors }
    );
    this.name = 'ValidationError';
  }
}
```

## Error Boundary Component

### Component-Level Error Handling

```typescript
import { Component, input, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    @if (error()) {
      <nz-result
        nzStatus="error"
        [nzTitle]="error()!.message"
        [nzSubTitle]="getSubtitle()">
        
        <div nz-result-extra>
          @if (error()!.recoverable) {
            <button nz-button nzType="primary" (click)="retry()">
              <span nz-icon nzType="reload"></span>
              Retry
            </button>
          }
          
          <button nz-button (click)="reset()">
            <span nz-icon nzType="close"></span>
            Dismiss
          </button>
        </div>
      </nz-result>
    } @else {
      <ng-content />
    }
  `
})
export class ErrorBoundaryComponent {
  error = signal<AppError | null>(null);
  
  catchError(error: Error | AppError): void {
    if (error instanceof AppError) {
      this.error.set(error);
    } else {
      this.error.set(new AppError(
        error.message,
        'UNKNOWN_ERROR',
        ErrorSeverity.Medium,
        true
      ));
    }
  }
  
  getSubtitle(): string {
    const err = this.error();
    if (!err) return '';
    
    return err.recoverable
      ? 'This error is recoverable. You can retry the operation.'
      : 'Please contact support if this problem persists.';
  }
  
  retry(): void {
    this.error.set(null);
    // Emit retry event or call retry callback
  }
  
  reset(): void {
    this.error.set(null);
  }
}
```

### Usage

```typescript
<app-error-boundary>
  <app-my-component />
</app-error-boundary>
```

## Best Practices

### 1. Error Handling Strategy

- **Client-side validation** - Catch errors before API calls
- **HTTP interceptor** - Handle HTTP errors globally
- **Global error handler** - Catch unhandled errors
- **Error boundary** - Component-level error containment

### 2. User Communication

- **Clear messages** - Explain what went wrong
- **Actionable feedback** - Provide next steps
- **Consistent design** - Use ng-zorro Result component
- **Helpful links** - Link to support or documentation

### 3. Error Logging

- **Log all errors** - Use LoggerService
- **Include context** - Add relevant metadata
- **Severity levels** - Categorize errors
- **Send to backend** - Aggregate errors for analysis

### 4. Development vs Production

- **Development** - Show detailed error messages
- **Production** - Show user-friendly messages
- **Stack traces** - Only in development
- **Error reporting** - Send to monitoring service in production

## Testing

### Unit Tests

```typescript
describe('ExceptionComponent', () => {
  it('should display 404 page', () => {
    const component = TestBed.createComponent(ExceptionComponent);
    component.componentRef.setInput('type', '404');
    component.detectChanges();
    
    const title = component.nativeElement.querySelector('.ant-result-title');
    expect(title.textContent).toContain('404');
  });
});
```

### E2E Tests

```typescript
test('should show 404 page for invalid route', async ({ page }) => {
  await page.goto('/invalid-route');
  await expect(page.locator('text=404')).toBeVisible();
  await expect(page.locator('text=page you visited does not exist')).toBeVisible();
});
```

## Troubleshooting

**Issue**: Errors not caught by global handler  
**Solution**: Ensure GlobalErrorHandler is registered in app.config.ts

**Issue**: HTTP errors not triggering interceptor  
**Solution**: Verify errorInterceptor is registered with provideHttpClient

**Issue**: Error pages not displaying  
**Solution**: Check exception routes are registered correctly

**Issue**: Infinite error loop  
**Solution**: Ensure error handlers don't throw new errors

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application configuration
- **[Core Services](../../core/AGENTS.md)** - Error services
- **[Routes](../AGENTS.md)** - Routing configuration

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
