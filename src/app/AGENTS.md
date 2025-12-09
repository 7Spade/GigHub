# App Module Agent Guide

The App module is the **entry point** of the GigHub application, responsible for bootstrapping and configuring the entire Angular application.

## Module Purpose

The App module serves as:
- **Application bootstrap point** - Initializes the Angular application
- **Root configuration** - Provides app-wide configuration and services
- **Layout orchestration** - Routes to different layout components based on context
- **Global providers** - Registers global services, interceptors, and guards
- **Firebase integration** - Configures @angular/fire with Firebase services

## Module Structure

```
src/app/
├── AGENTS.md                    # This file
├── app.component.ts             # Root component
├── app.config.ts                # Application configuration (standalone)
├── core/                        # Core services (AGENTS.md)
│   ├── services/                # Singleton services
│   ├── guards/                  # Route guards
│   ├── errors/                  # Custom error classes
│   ├── infra/                   # Infrastructure (repositories)
│   ├── startup/                 # App initialization
│   └── i18n/                    # Internationalization
├── layout/                      # Layout components (AGENTS.md)
│   ├── basic/                   # Main app layout
│   ├── blank/                   # Blank layout (minimal)
│   └── passport/                # Authentication layout
├── routes/                      # Feature modules (AGENTS.md)
│   ├── blueprint/               # Blueprint management
│   ├── dashboard/               # Dashboard views
│   ├── passport/                # Auth flows
│   ├── exception/               # Error pages
│   ├── organization/            # Organization management
│   ├── team/                    # Team management
│   └── user/                    # User management
└── shared/                      # Shared components (AGENTS.md)
    ├── components/              # Reusable components
    ├── services/                # Shared services
    ├── pipes/                   # Custom pipes
    ├── directives/              # Custom directives
    └── utils/                   # Utility functions
```

## Application Configuration

### app.config.ts

**Purpose**: Main application configuration using standalone components pattern (Angular 19+)

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';

import { routes } from './routes/routes';
import { environment } from '@env/environment';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone change detection
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Router with modern features
    provideRouter(
      routes,
      withComponentInputBinding(),  // Enable route input binding
      withHashLocation()             // Use hash-based routing
    ),
    
    // Animations
    provideAnimations(),
    
    // HTTP with interceptors
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    
    // Firebase/Firestore
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    
    // ng-alain configuration
    ...provideNgAlain()
  ]
};
```

**Key Features**:
- **Standalone Components**: No NgModules required (Angular 19+)
- **Firebase Integration**: Configured via @angular/fire
- **Modern Router**: Input binding and hash location
- **HTTP Interceptors**: Auth token and error handling
- **ng-alain**: Admin framework configuration

### app.component.ts

**Purpose**: Root component that renders the router outlet

```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: []
})
export class AppComponent {
  title = 'GigHub';
}
```

**Note**: The root component is minimal - all layout logic is delegated to layout components.

## Architecture Layers

### Foundation Layer (基礎層)

**Purpose**: Core infrastructure and identity management

**Modules**:
- **Account & Auth**: User identity, authentication, session management
- **Organization**: Multi-tenant organization management
- **Team**: Team-based collaboration

**Key Services**:
- `FirebaseAuthService` - Firebase authentication (@angular/fire/auth)
- `AccountService` - User account operations
- `OrganizationService` - Organization CRUD
- `TeamService` - Team management

### Container Layer (容器層)

**Purpose**: Project/workspace container and configuration

**Modules**:
- **Blueprint**: Main project container with permissions and settings
- **Events**: Event bus for cross-module communication
- **Permissions**: Fine-grained access control

**Key Services**:
- `BlueprintService` - Blueprint CRUD operations
- `BlueprintEventBus` - Event-driven communication
- `PermissionService` - Permission checking

### Business Layer (業務層)

**Purpose**: Domain-specific business modules

**Modules**:
- **Tasks**: Task management and tracking
- **Diary**: Daily construction logs
- **Quality**: Quality control and inspections
- **Financial**: Budget and cost management

**Pattern**: All business modules are scoped to a Blueprint container

## Bootstrap Process

### Initialization Flow

```
1. main.ts
   ↓
2. bootstrapApplication(AppComponent, appConfig)
   ↓
3. Load app.config.ts providers
   ↓
4. Initialize Firebase (@angular/fire)
   ↓
5. Register routes (lazy-loaded)
   ↓
6. Run APP_INITIALIZER (StartupService)
   ↓
7. Check authentication state
   ↓
8. Render AppComponent
   ↓
9. Navigate to initial route
   ↓
10. Load appropriate layout
    ↓
11. Load feature module (lazy)
```

### main.ts

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

## Firebase/Firestore Integration

### Configuration

Firebase is configured in `environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID'
  }
};
```

### Firebase Services

**Available via @angular/fire**:
- **Authentication** (`provideAuth()`) - User authentication with Firebase Auth
- **Firestore** (`provideFirestore()`) - NoSQL database
- **Storage** (`provideStorage()`) - File storage
- **Functions** (optional) - Cloud functions

**Usage Pattern**:
```typescript
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

export class MyService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  
  // Use Firebase services
}
```

## HTTP Interceptors

### AuthInterceptor

**Purpose**: Automatically attach Firebase Auth token to requests

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  
  return from(auth.currentUser?.getIdToken()).pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });
        return next(authReq);
      }
      return next(req);
    })
  );
};
```

### ErrorInterceptor

**Purpose**: Global error handling for HTTP requests

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const message = inject(NzMessageService);
  const logger = inject(LoggerService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      logger.error('HTTP Error', error);
      
      // Handle different error types
      if (error.status === 401) {
        message.error('Unauthorized - please login');
      } else if (error.status === 403) {
        message.error('Permission denied');
      } else if (error.status >= 500) {
        message.error('Server error - please try again');
      }
      
      return throwError(() => error);
    })
  );
};
```

## State Management Strategy

### Signal-Based State

GigHub uses **Angular Signals** (v19+) for reactive state management:

**Advantages**:
- **Fine-grained reactivity** - Only recompute what changed
- **Automatic dependency tracking** - No manual subscriptions
- **Better performance** - Less change detection overhead
- **Simpler code** - No RxJS boilerplate for simple state

**Pattern**:
```typescript
export class MyComponent {
  // Writable signal
  count = signal(0);
  
  // Computed signal (derived state)
  doubled = computed(() => this.count() * 2);
  
  // Effect (side effects)
  constructor() {
    effect(() => {
      console.log('Count changed:', this.count());
    });
  }
  
  // Update signal
  increment() {
    this.count.update(n => n + 1);
  }
}
```

### When to Use RxJS

Use RxJS for:
- **HTTP requests** - Already returns Observables
- **WebSocket/Real-time data** - Firestore snapshots
- **Event streams** - User input events
- **Complex async flows** - Multiple async operations

**Integration with Signals**:
```typescript
import { toSignal } from '@angular/core/rxjs-interop';

export class MyComponent {
  private service = inject(MyService);
  
  // Convert Observable to Signal
  data = toSignal(this.service.data$, { initialValue: [] });
}
```

## Routing Strategy

### Hash-Based Routing

GigHub uses hash-based routing (`#/`) for compatibility:

```typescript
provideRouter(routes, withHashLocation())
```

**URLs**:
- `/#/dashboard` - Dashboard
- `/#/blueprint` - Blueprint list
- `/#/blueprint/123` - Blueprint detail
- `/#/passport/login` - Login page

**Advantages**:
- Works without server configuration
- Compatible with Firebase Hosting
- Easier deployment

### Route Input Binding

Modern Angular route input binding enabled:

```typescript
provideRouter(routes, withComponentInputBinding())
```

**Benefit**: Route parameters automatically injected as component inputs

**Example**:
```typescript
export class BlueprintDetailComponent {
  // Automatically receives route parameter 'id'
  id = input.required<string>();
  
  blueprint = computed(() => this.loadBlueprint(this.id()));
}
```

## Module Communication

### Event Bus Pattern

Cross-module communication via `BlueprintEventBus`:

```typescript
// In any service
private eventBus = inject(BlueprintEventBus);

// Emit event
this.eventBus.emit({
  type: 'blueprint.created',
  blueprintId: blueprint.id,
  timestamp: Date.now(),
  actor: userId,
  data: blueprint
});

// Subscribe to events
this.eventBus.created$
  .pipe(takeUntilDestroyed())
  .subscribe(event => {
    console.log('Blueprint created:', event);
  });
```

**Benefits**:
- **Loose coupling** - Modules don't directly depend on each other
- **Scalability** - Easy to add new event handlers
- **Debugging** - Central event log
- **Audit trail** - All events logged

## Environment Configuration

### Development vs Production

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5001',
  firebase: { /* dev config */ },
  logging: { enabled: true, level: 'debug' }
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  apiUrl: 'https://api.gighub.app',
  firebase: { /* prod config */ },
  logging: { enabled: true, level: 'error' }
};
```

### Feature Flags

```typescript
export const features = {
  enableNewDashboard: true,
  enableRealtimeSync: true,
  enableAdvancedPermissions: false
};
```

## Testing Strategy

### Unit Tests

Test components, services, and pipes in isolation:

```typescript
describe('AppComponent', () => {
  it('should create', () => {
    const component = TestBed.createComponent(AppComponent);
    expect(component).toBeTruthy();
  });
});
```

### Integration Tests

Test module integration and routing:

```typescript
describe('Dashboard Integration', () => {
  it('should navigate to dashboard after login', async () => {
    await authService.login('test@example.com', 'password');
    expect(router.url).toBe('/dashboard');
  });
});
```

### E2E Tests

Test complete user flows with Playwright:

```typescript
test('complete blueprint creation flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=New Blueprint');
  await page.fill('input[name="name"]', 'Test Project');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Test Project')).toBeVisible();
});
```

## Performance Optimization

### Lazy Loading

All feature modules are lazy-loaded:

```typescript
{
  path: 'blueprint',
  loadChildren: () => import('./routes/blueprint/routes')
    .then(m => m.routes)
}
```

**Benefits**:
- Smaller initial bundle
- Faster first load
- Better caching

### OnPush Change Detection

All components use `OnPush` strategy:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent { }
```

**Benefits**:
- Reduced change detection cycles
- Better performance
- Works well with Signals

### Signals + OnPush

Best performance combination:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedComponent {
  // Signals automatically trigger change detection
  data = signal<Data[]>([]);
  
  // Computed signals are memoized
  filtered = computed(() => this.data().filter(d => d.active));
}
```

## Security Best Practices

### 1. Firestore Security Rules

All data access protected by server-side rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /blueprints/{blueprintId} {
      allow read: if isAuthenticated() && canRead(blueprintId);
      allow write: if isAuthenticated() && canEdit(blueprintId);
    }
  }
}
```

### 2. Route Guards

Protected routes use functional guards:

```typescript
{
  path: 'dashboard',
  canActivate: [authGuard],
  loadChildren: () => import('./routes/dashboard/routes')
}
```

### 3. Input Sanitization

Use Angular's built-in sanitization:

```typescript
import { DomSanitizer } from '@angular/platform-browser';

// Sanitize user input before rendering
safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, userInput);
```

### 4. HTTPS Only

Enforce HTTPS in production:

```typescript
if (environment.production && location.protocol !== 'https:') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

## Common Patterns

### Service Injection

Modern `inject()` function:

```typescript
export class MyComponent {
  private service = inject(MyService);
  private router = inject(Router);
  private auth = inject(Auth);
}
```

### Component Communication

Use signals and outputs:

```typescript
// Parent
<child-component
  [data]="parentData()"
  (action)="handleAction($event)" />

// Child
export class ChildComponent {
  data = input.required<Data>();
  action = output<Action>();
  
  doSomething() {
    this.action.emit({ type: 'clicked' });
  }
}
```

### Async Data Loading

Pattern with loading and error states:

```typescript
export class DataComponent {
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<Data[]>([]);
  
  async load() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const result = await this.service.getData();
      this.data.set(result);
    } catch (err) {
      this.error.set(err.message);
    } finally {
      this.loading.set(false);
    }
  }
}
```

## Troubleshooting

### Common Issues

**Issue**: Firebase not initialized  
**Solution**: Check environment.ts has correct Firebase config

**Issue**: Route not loading  
**Solution**: Verify route path and lazy-load import

**Issue**: Signals not updating UI  
**Solution**: Ensure OnPush + signal pattern, call `.set()` or `.update()`

**Issue**: HTTP interceptor not working  
**Solution**: Verify interceptor registered in app.config.ts

## Related Documentation

- **[Root AGENTS.md](../AGENTS.md)** - Project overview
- **[Core Services](./core/AGENTS.md)** - Core infrastructure
- **[Layout](./layout/AGENTS.md)** - Layout system
- **[Routes](./routes/AGENTS.md)** - Feature modules
- **[Shared](./shared/AGENTS.md)** - Reusable components

## Development Commands

```bash
# Development server
yarn start              # http://localhost:4200

# Build
yarn build              # Production build
yarn build:dev          # Development build

# Testing
yarn test               # Unit tests
yarn test:coverage      # With coverage
yarn e2e                # E2E tests

# Linting
yarn lint               # TypeScript + SCSS
yarn lint:fix           # Auto-fix issues

# Code generation
ng g component my-component --standalone
ng g service my-service
ng g guard my-guard --functional
```

## Best Practices

1. **Use Standalone Components** - No NgModules
2. **Use Signals** - For reactive state
3. **Use inject()** - For dependency injection
4. **Use OnPush** - For change detection
5. **Use Lazy Loading** - For feature modules
6. **Use Functional Guards** - Instead of class-based
7. **Use Route Input Binding** - For cleaner code
8. **Use Firebase/Firestore** - As primary backend
9. **Use TypeScript Strict Mode** - For type safety
10. **Write Tests** - For critical functionality

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
