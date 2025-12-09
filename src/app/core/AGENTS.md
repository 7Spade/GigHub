# Core Services Agent Guide

The Core module contains essential services, guards, interceptors, and infrastructure that support the entire GigHub application.

## Module Purpose

Core services provide:
- **Singleton services** used across the application
- **HTTP interceptors** for request/response handling
- **Route guards** for navigation control
- **Error handling** infrastructure
- **Repository pattern** for data access
- **Application startup** logic

## Module Structure

```
src/app/core/
├── services/          # Global singleton services
│   ├── firebase-auth.service.ts     # Firebase Authentication
│   ├── logger.service.ts            # Logging & monitoring
│   ├── permission.service.ts        # Permission checking
│   ├── validation.service.ts        # Data validation
│   └── supabase.service.ts          # (Statistics only)
├── guards/            # Route guards
│   ├── auth.guard.ts                # Authentication guard
│   ├── permission.guard.ts          # Authorization guard
│   └── module-enabled.guard.ts      # Feature flag guard
├── errors/            # Custom error classes
│   ├── blueprint-error.ts           # Base error class
│   ├── permission-denied-error.ts   # Permission errors
│   ├── validation-error.ts          # Validation errors
│   └── module-not-found-error.ts    # Module errors
├── infra/             # Infrastructure layer
│   └── repositories/  # Data access repositories
│       ├── blueprint/               # Blueprint repos
│       ├── account/                 # Account repos
│       ├── task/                    # Task repos
│       └── ...                      # Other repos
├── startup/           # App initialization
│   └── startup.service.ts           # Startup logic
├── i18n/              # Internationalization
│   └── i18n.service.ts              # Translation service
└── index.ts           # Public API exports
```

## Key Services

### FirebaseAuthService

**Purpose**: Firebase Authentication with @angular/fire  
**Location**: `src/app/core/services/firebase-auth.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private auth = inject(Auth);
  private tokenService = inject(DA_SERVICE_TOKEN);
  private settingsService = inject(SettingsService);
  private router = inject(Router);
  
  get user$(): Observable<User | null> {
    return authState(this.auth);
  }
  
  get currentUser(): User | null {
    return this.auth.currentUser;
  }
  
  // Auth methods
  async signIn(email: string, password: string) {
    const { user } = await signInWithEmailAndPassword(this.auth, email, password);
    return user;
  }
  
  async signUp(email: string, password: string) {
    const { user } = await createUserWithEmailAndPassword(this.auth, email, password);
    return user;
  }
  
  async signOut() {
    await signOut(this.auth);
    this.router.navigate(['/passport/login']);
  }
}
```

**Usage**:
```typescript
// In component
private authService = inject(FirebaseAuthService);

async login() {
  try {
    await this.authService.signIn(email, password);
    this.router.navigate(['/dashboard']);
  } catch (error) {
    this.message.error('Login failed');
  }
}
```

### FirestoreService (Optional Wrapper)

**Purpose**: Centralized Firestore access  
**Location**: `src/app/core/services/firestore.service.ts` (if exists)

```typescript
@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);
  
  collection<T>(path: string) {
    return collection(this.firestore, path);
  }
  
  doc<T>(path: string, id: string) {
    return doc(this.firestore, path, id);
  }
  
  // Helper methods for common operations
  async getDoc<T>(path: string, id: string): Promise<T | null> {
    const docRef = doc(this.firestore, path, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as T : null;
  }
  
  getCollection$<T>(path: string, ...queryConstraints: QueryConstraint[]): Observable<T[]> {
    const collectionRef = collection(this.firestore, path);
    const q = query(collectionRef, ...queryConstraints);
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }
}
```

### SupabaseService (Statistics Only)

**Purpose**: Query statistics data only (NOT for main app data)  
**Location**: `src/app/core/services/supabase.service.ts`

**⚠️ Important**: This service is ONLY for querying read-only statistics data. All main application data (blueprints, tasks, etc.) uses Firebase/Firestore.

```typescript
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabaseClient: SupabaseClient;
  
  constructor() {
    this.supabaseClient = createClient(
      'https://edfxrqgadtlnfhqqmgjw.supabase.co',
      'eyJhbGci...' // Anon key for stats only
    );
  }
  
  get client(): SupabaseClient {
    return this.supabaseClient;
  }
  
  // Only for statistics queries
  from(table: string) {
    return this.supabaseClient.from(table);
  }
}
```

**Usage** (Statistics only):
```typescript
// In statistics dashboard
private supabase = inject(SupabaseService);

async loadStats() {
  const { data } = await this.supabase.from('statistics')
    .select('*')
    .order('date', { ascending: false });
  return data;
}
```

### LoggerService

**Purpose**: Structured logging with severity levels  
**Location**: `src/app/core/services/logger.service.ts`

```typescript
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Critical = 4
}

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private minLevel = environment.production ? LogLevel.Warn : LogLevel.Debug;
  
  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.Debug, message, context);
  }
  
  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.Info, message, context);
  }
  
  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.Warn, message, context);
  }
  
  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.Error, message, { ...context, error });
  }
  
  critical(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.Critical, message, { ...context, error });
    // Send to monitoring service
    this.sendToMonitoring(message, error, context);
  }
  
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    if (level < this.minLevel) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      ...context
    };
    
    // Console output
    console.log(JSON.stringify(logEntry));
    
    // Send to backend (if configured)
    if (environment.logging.enabled) {
      this.sendToBackend(logEntry);
    }
  }
}
```

**Usage**:
```typescript
private logger = inject(LoggerService);

async loadData() {
  try {
    this.logger.debug('Loading data', { userId: this.userId });
    const data = await this.repository.getData();
    this.logger.info('Data loaded successfully', { count: data.length });
    return data;
  } catch (error) {
    this.logger.error('Failed to load data', error as Error, { userId: this.userId });
    throw error;
  }
}
```

### PermissionService

**Purpose**: Client-side permission checking with caching  
**Location**: `src/app/core/services/permission.service.ts`

```typescript
interface CachedPermission {
  value: boolean;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private cache = new Map<string, CachedPermission>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  private blueprintMemberRepo = inject(BlueprintMemberRepository);
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  
  // Permission checks
  async canRead(blueprintId: string): Promise<boolean> {
    return this.checkPermission(blueprintId, ['viewer', 'contributor', 'maintainer']);
  }
  
  async canEdit(blueprintId: string): Promise<boolean> {
    return this.checkPermission(blueprintId, ['contributor', 'maintainer']);
  }
  
  async canDelete(blueprintId: string): Promise<boolean> {
    return this.checkPermission(blueprintId, ['maintainer']);
  }
  
  async canManageMembers(blueprintId: string): Promise<boolean> {
    return this.checkPermission(blueprintId, ['maintainer']);
  }
  
  async canManageSettings(blueprintId: string): Promise<boolean> {
    return this.checkPermission(blueprintId, ['maintainer']);
  }
  
  // Core permission checking with cache
  private async checkPermission(
    blueprintId: string, 
    allowedRoles: string[]
  ): Promise<boolean> {
    const cacheKey = `${blueprintId}:${allowedRoles.join(',')}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }
    
    // Fetch from Firestore
    const user = this.auth.currentUser;
    if (!user) return false;
    
    const userId = user.uid;
    
    // Check if owner
    const blueprintRef = doc(this.firestore, 'blueprints', blueprintId);
    const blueprintSnap = await getDoc(blueprintRef);
    
    if (blueprintSnap.exists()) {
      const blueprint = blueprintSnap.data();
      if (blueprint['owner_type'] === 'user' && blueprint['owner_id'] === userId) {
        this.setCache(cacheKey, true);
        return true;
      }
    }
    
    // Check member role
    const member = await this.blueprintMemberRepo.findByAccountId(blueprintId, userId);
    const hasRole = member && allowedRoles.includes(member.role);
    
    this.setCache(cacheKey, hasRole);
    return hasRole;
  }
  
  private setCache(key: string, value: boolean) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  clearCache(blueprintId?: string) {
    if (blueprintId) {
      // Clear specific blueprint cache
      for (const key of this.cache.keys()) {
        if (key.startsWith(blueprintId)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }
}
```

### ValidationService

**Purpose**: Schema-based declarative validation  
**Location**: `src/app/core/services/validation.service.ts`

```typescript
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
}

@Injectable({ providedIn: 'root' })
export class ValidationService {
  validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string[]> = {};
    
    for (const [field, rules] of Object.entries(schema)) {
      const fieldErrors = this.validateField(data[field], rules);
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  private validateField(value: any, rules: ValidationRule[]): string[] {
    const errors: string[] = [];
    
    for (const rule of rules) {
      const error = this.validateRule(value, rule);
      if (error) {
        errors.push(error);
      }
    }
    
    return errors;
  }
  
  private validateRule(value: any, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'required':
        return !value ? rule.message : null;
        
      case 'minLength':
        return value && value.length < rule.value ? rule.message : null;
        
      case 'maxLength':
        return value && value.length > rule.value ? rule.message : null;
        
      case 'pattern':
        return value && !rule.value.test(value) ? rule.message : null;
        
      case 'custom':
        return !rule.value(value) ? rule.message : null;
        
      default:
        return null;
    }
  }
}
```

**Usage**:
```typescript
// Define schema
const schema: ValidationSchema = {
  name: [
    { type: 'required', message: 'Name is required' },
    { type: 'minLength', value: 3, message: 'Name must be at least 3 characters' }
  ],
  email: [
    { type: 'required', message: 'Email is required' },
    { type: 'pattern', value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
  ]
};

// Validate data
const result = validationService.validate(formData, schema);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

## Route Guards

### AuthGuard

**Purpose**: Ensure user is authenticated  
**Location**: `src/app/core/guards/auth.guard.ts`

```typescript
export const authGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  
  const { data: { session } } = await supabase.getSession();
  
  if (session) {
    return true;
  }
  
  // Redirect to login with return URL
  return router.createUrlTree(['/passport/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

**Usage in routes**:
```typescript
{
  path: 'blueprint',
  canActivate: [authGuard],
  loadChildren: () => import('./routes/blueprint/routes')
}
```

### PermissionGuard

**Purpose**: Check user has required permission for route  
**Location**: `src/app/core/guards/permission.guard.ts`

```typescript
export const permissionGuard = (requiredPermission: string): CanActivateFn => {
  return async (route, state) => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);
    
    const blueprintId = route.paramMap.get('id');
    if (!blueprintId) {
      return router.createUrlTree(['/exception/403']);
    }
    
    const hasPermission = await permissionService.canRead(blueprintId);
    
    if (hasPermission) {
      return true;
    }
    
    return router.createUrlTree(['/exception/403']);
  };
};
```

**Usage in routes**:
```typescript
{
  path: 'blueprint/:id',
  canActivate: [authGuard, permissionGuard('read')],
  component: BlueprintDetailComponent
}
```

### ModuleEnabledGuard

**Purpose**: Check if blueprint module is enabled  
**Location**: `src/app/core/guards/module-enabled.guard.ts`

```typescript
export const moduleEnabledGuard = (moduleId: string): CanActivateFn => {
  return async (route, state) => {
    const firestore = inject(Firestore);
    const router = inject(Router);
    
    const blueprintId = route.paramMap.get('blueprintId');
    if (!blueprintId) return false;
    
    const blueprintRef = doc(firestore, 'blueprints', blueprintId);
    const blueprintSnap = await getDoc(blueprintRef);
    
    if (blueprintSnap.exists()) {
      const blueprint = blueprintSnap.data();
      if (blueprint['enabled_modules']?.includes(moduleId)) {
        return true;
      }
    }
    
    return router.createUrlTree(['/blueprint', blueprintId], {
      queryParams: { error: 'module_not_enabled' }
    });
  };
};
```

**Usage in routes**:
```typescript
{
  path: 'blueprint/:blueprintId/tasks',
  canActivate: [authGuard, moduleEnabledGuard('task')],
  loadChildren: () => import('./routes/task/routes')
}
```

## Error Handling

### Custom Error Classes

**Base Error Class**:
```typescript
export enum ErrorSeverity {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}

export class BlueprintError extends Error {
  severity: ErrorSeverity;
  recoverable: boolean;
  context?: Record<string, any>;
  
  constructor(
    message: string,
    options: {
      severity?: ErrorSeverity;
      recoverable?: boolean;
      context?: Record<string, any>;
    } = {}
  ) {
    super(message);
    this.name = 'BlueprintError';
    this.severity = options.severity || ErrorSeverity.Medium;
    this.recoverable = options.recoverable ?? true;
    this.context = options.context;
  }
}
```

**Specialized Error Classes**:
```typescript
export class PermissionDeniedError extends BlueprintError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, {
      severity: ErrorSeverity.High,
      recoverable: false,
      context
    });
    this.name = 'PermissionDeniedError';
  }
}

export class ValidationError extends BlueprintError {
  constructor(
    message: string,
    public errors: Record<string, string[]>,
    context?: Record<string, any>
  ) {
    super(message, {
      severity: ErrorSeverity.Medium,
      recoverable: true,
      context
    });
    this.name = 'ValidationError';
  }
}

export class ModuleNotFoundError extends BlueprintError {
  constructor(moduleId: string, context?: Record<string, any>) {
    super(`Module not found: ${moduleId}`, {
      severity: ErrorSeverity.High,
      recoverable: false,
      context
    });
    this.name = 'ModuleNotFoundError';
  }
}
```

**Usage**:
```typescript
async getData() {
  try {
    const data = await this.repository.fetchData();
    return data;
  } catch (error) {
    if (error.code === '42501') {
      throw new PermissionDeniedError('Access denied', { 
        action: 'fetch_data' 
      });
    }
    throw new BlueprintError('Failed to fetch data', {
      severity: ErrorSeverity.High,
      context: { error }
    });
  }
}
```

## Repository Pattern

### Base Repository Structure

```typescript
import { inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  QueryConstraint,
  Timestamp
} from '@angular/fire/firestore';

export abstract class BaseRepository<T> {
  protected firestore = inject(Firestore);
  protected logger = inject(LoggerService);
  
  abstract get collectionName(): string;
  
  async findById(id: string): Promise<T | null> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (error) {
      this.logger.error(`Failed to find ${this.collectionName} by id`, error as Error, { id });
      throw error;
    }
  }
  
  async list(filter?: Record<string, any>): Promise<T[]> {
    try {
      const collectionRef = collection(this.firestore, this.collectionName);
      const constraints: QueryConstraint[] = [where('deleted_at', '==', null)];
      
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          constraints.push(where(key, '==', value));
        }
      }
      
      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      this.logger.error(`Failed to list ${this.collectionName}`, error as Error, { filter });
      throw error;
    }
  }
  
  async create(entity: Partial<T>): Promise<T> {
    try {
      const collectionRef = collection(this.firestore, this.collectionName);
      const docRef = await addDoc(collectionRef, {
        ...entity,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      
      const docSnap = await getDoc(docRef);
      return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (error) {
      this.logger.error(`Failed to create ${this.collectionName}`, error as Error, { entity });
      throw error;
    }
  }
  
  async update(id: string, entity: Partial<T>): Promise<T> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      await updateDoc(docRef, {
        ...entity,
        updated_at: Timestamp.now()
      });
      
      const docSnap = await getDoc(docRef);
      return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (error) {
      this.logger.error(`Failed to update ${this.collectionName}`, error as Error, { id, entity });
      throw error;
    }
  }
  
  async softDelete(id: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      await updateDoc(docRef, {
        deleted_at: Timestamp.now()
      });
    } catch (error) {
      this.logger.error(`Failed to soft delete ${this.collectionName}`, error as Error, { id });
      throw error;
    }
  }
}
```

### Concrete Repository Example

```typescript
@Injectable({ providedIn: 'root' })
export class BlueprintRepository extends BaseRepository<Blueprint> {
  get collectionName(): string {
    return 'blueprints';
  }
  
  async findBySlug(slug: string): Promise<Blueprint | null> {
    const collectionRef = collection(this.firestore, this.collectionName);
    const q = query(
      collectionRef,
      where('slug', '==', slug),
      where('deleted_at', '==', null)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Blueprint;
  }
  
  async findByOwnerId(ownerId: string, ownerType: 'user' | 'organization'): Promise<Blueprint[]> {
    const collectionRef = collection(this.firestore, this.collectionName);
    const q = query(
      collectionRef,
      where('owner_id', '==', ownerId),
      where('owner_type', '==', ownerType),
      where('deleted_at', '==', null)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Blueprint[];
  }
}
```

## Startup Service

**Purpose**: Initialize app on startup  
**Location**: `src/app/core/startup/startup.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class StartupService {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);
  
  async load(): Promise<void> {
    try {
      // 1. Check authentication
      await this.checkAuth();
      
      // 2. Load user preferences
      await this.loadPreferences();
      
      // 3. Initialize services
      await this.initializeServices();
      
      this.logger.info('Application startup completed');
    } catch (error) {
      this.logger.critical('Application startup failed', error as Error);
      throw error;
    }
  }
  
  private async checkAuth(): Promise<void> {
    const { data: { session } } = await this.supabase.getSession();
    if (session) {
      this.logger.info('User authenticated', { userId: session.user.id });
    }
  }
  
  private async loadPreferences(): Promise<void> {
    // Load user preferences from storage
  }
  
  private async initializeServices(): Promise<void> {
    // Initialize required services
  }
}
```

**Usage in app.config.ts**:
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (startup: StartupService) => () => startup.load(),
      deps: [StartupService],
      multi: true
    }
  ]
};
```

## Enterprise Service Patterns

### Service 生命週期管理 (Service Lifecycle)

#### Singleton Services (全局服務)

```typescript
// ✅ GOOD: Root-level singleton
@Injectable({ providedIn: 'root' })
export class GlobalService {
  // Shared across entire app
  // Lives for app lifetime
  // State persists across routes
}
```

#### Scoped Services (範圍服務)

```typescript
// ✅ GOOD: Component-scoped service
@Component({
  providers: [ScopedService] // Lives only in this component tree
})
export class MyComponent {
  private scoped = inject(ScopedService);
}
```

### 共享狀態管理 (Shared State Management)

#### Signal-based State Service

```typescript
@Injectable({ providedIn: 'root' })
export class StateService {
  // Private writable signal
  private _state = signal<AppState>(initialState);
  
  // Public readonly signal
  state = this._state.asReadonly();
  
  // Computed derived state
  isLoading = computed(() => this._state().loading);
  currentUser = computed(() => this._state().user);
  
  // State mutations
  setLoading(loading: boolean): void {
    this._state.update(current => ({ ...current, loading }));
  }
}
```

### 事件驅動服務 (Event-Driven Services)

```typescript
@Injectable({ providedIn: 'root' })
export class EventService {
  private events = new Subject<AppEvent>();
  
  events$ = this.events.asObservable();
  
  emit(event: AppEvent): void {
    this.events.next(event);
  }
  
  on(type: string): Observable<AppEvent> {
    return this.events$.pipe(filter(e => e.type === type));
  }
}
```

### Repository 擴展模式 (Repository Extension)

```typescript
export abstract class FirestoreRepository<T extends { id?: string }> {
  protected firestore = inject(Firestore);
  
  abstract collectionPath: string;
  
  async findAll(): Promise<T[]> {
    const snapshot = await getDocs(collection(this.firestore, this.collectionPath));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }
  
  async findById(id: string): Promise<T | null> {
    const docRef = doc(this.firestore, this.collectionPath, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as T : null;
  }
}
```

## Best Practices

1. **Service Design**
   - Keep services focused and single-purpose
   - Use dependency injection for testability
   - Provide in 'root' for singletons
   - Document public APIs with JSDoc

2. **Error Handling**
   - Use custom error classes for specific scenarios
   - Include context in error objects
   - Log errors with appropriate severity
   - Provide user-friendly error messages

3. **Repository Pattern**
   - Abstract database operations
   - Handle errors consistently
   - Use TypeScript generics for reusability
   - Implement soft delete for data retention

4. **Guards**
   - Keep guard logic simple
   - Return UrlTree for redirects
   - Combine guards with [guard1, guard2] for complex checks
   - Cache permission results when appropriate

5. **Logging**
   - Use appropriate log levels
   - Include relevant context
   - Avoid logging sensitive data
   - Configure different levels for dev/prod

## Related Documentation

- **[Root AGENTS.md](../../AGENTS.md)** - Project-wide context
- **[Blueprint Module](../routes/blueprint/AGENTS.md)** - Blueprint specifics
- **[Shared Components](../shared/AGENTS.md)** - Reusable components

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
