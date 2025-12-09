# Shared Components Agent Guide

The Shared module contains reusable components, services, pipes, directives, and utilities used across the GigHub application.

## Module Purpose

Shared module provides:
- **Reusable UI components** for consistent user experience
- **Common utilities** for data manipulation and formatting
- **Shared services** for cross-cutting concerns
- **Custom pipes** for data transformation in templates
- **Custom directives** for DOM manipulation and behavior
- **SHARED_IMPORTS** constant for common module imports

## Module Structure

```
src/app/shared/
├── components/              # Reusable UI components
│   ├── page-header/         # Page header with breadcrumbs
│   ├── result/              # Success/error result pages
│   ├── exception/           # Error display components
│   └── widgets/             # Small reusable widgets
├── services/                # Shared services
│   ├── validation/          # Validation service & schemas
│   ├── blueprint/           # Blueprint service (if shared)
│   └── utils/               # Utility services
├── pipes/                   # Custom pipes
│   ├── safe.pipe.ts         # SafeHtml/SafeUrl sanitization
│   ├── time-ago.pipe.ts     # Relative time formatting
│   └── file-size.pipe.ts    # File size formatting
├── directives/              # Custom directives
│   ├── permission.directive.ts   # Show/hide based on permission
│   └── auto-focus.directive.ts   # Auto-focus on load
├── utils/                   # Utility functions
│   ├── date.utils.ts        # Date manipulation
│   ├── string.utils.ts      # String utilities
│   └── array.utils.ts       # Array utilities
└── index.ts                 # Public API & SHARED_IMPORTS
```

## SHARED_IMPORTS

**Purpose**: Centralized imports for common modules  
**Location**: `src/app/shared/index.ts`

```typescript
export const SHARED_IMPORTS = [
  CommonModule,
  ReactiveFormsModule,
  FormsModule,
  RouterModule,
  
  // ng-zorro-antd components
  NzButtonModule,
  NzIconModule,
  NzCardModule,
  NzFormModule,
  NzInputModule,
  NzTableModule,
  NzModalModule,
  NzMessageModule,
  NzSpinModule,
  NzSelectModule,
  NzCheckboxModule,
  NzRadioModule,
  NzDatePickerModule,
  NzTagModule,
  NzBadgeModule,
  NzDividerModule,
  NzGridModule,
  NzLayoutModule,
  NzSpaceModule,
  NzTypographyModule,
  NzAlertModule,
  NzResultModule,
  NzBreadCrumbModule,
  NzDescriptionsModule,
  NzListModule,
  NzAvatarModule,
  NzDropDownModule,
  NzMenuModule,
  NzToolTipModule,
  NzPopconfirmModule,
  NzDrawerModule,
  NzTabsModule,
  NzStepsModule,
  NzProgressModule,
  NzUploadModule,
  
  // @delon components
  STModule,
  SEModule,
  SVModule,
  SGModule,
  
  // Shared components
  PageHeaderComponent,
  ResultComponent,
  ExceptionComponent,
  
  // Shared pipes
  SafePipe,
  TimeAgoPipe,
  FileSizePipe,
  
  // Shared directives
  PermissionDirective,
  AutoFocusDirective
];
```

**Usage**:
```typescript
import { Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `...`
})
export class MyComponent { }
```

## Reusable Components

### PageHeaderComponent

**Purpose**: Consistent page headers with breadcrumbs and actions  
**Location**: `src/app/shared/components/page-header/page-header.component.ts`

```typescript
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-page-header 
      [nzTitle]="title()" 
      [nzSubtitle]="subtitle()"
      [nzBackIcon]="showBack() ? 'arrow-left' : null"
      (nzBack)="onBack()">
      
      <nz-breadcrumb nz-page-header-breadcrumb>
        @for (item of breadcrumbs(); track item.path) {
          <nz-breadcrumb-item>
            @if (item.path) {
              <a [routerLink]="item.path">{{ item.label }}</a>
            } @else {
              {{ item.label }}
            }
          </nz-breadcrumb-item>
        }
      </nz-breadcrumb>
      
      <nz-page-header-extra>
        <ng-content />
      </nz-page-header-extra>
    </nz-page-header>
  `
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
  showBack = input<boolean>(false);
  breadcrumbs = input<Array<{ label: string; path?: string }>>([]);
  
  back = output<void>();
  
  private router = inject(Router);
  
  onBack() {
    if (this.back.observers.length > 0) {
      this.back.emit();
    } else {
      this.router.navigate(['../']);
    }
  }
}
```

**Usage**:
```typescript
<app-page-header
  title="Blueprint Details"
  subtitle="View and manage blueprint"
  [showBack]="true"
  [breadcrumbs]="[
    { label: 'Home', path: '/' },
    { label: 'Blueprints', path: '/blueprint' },
    { label: 'Details' }
  ]">
  <button nz-button nzType="primary" (click)="edit()">
    <span nz-icon nzType="edit"></span>
    Edit
  </button>
</app-page-header>
```

### ResultComponent

**Purpose**: Display success/error/info result pages  
**Location**: `src/app/shared/components/result/result.component.ts`

```typescript
type ResultStatus = 'success' | 'error' | 'info' | 'warning' | '404' | '403' | '500';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-result
      [nzStatus]="status()"
      [nzTitle]="title()"
      [nzSubTitle]="subtitle()">
      
      <div nz-result-extra>
        @if (showRetry()) {
          <button nz-button nzType="primary" (click)="retry.emit()">
            <span nz-icon nzType="reload"></span>
            Retry
          </button>
        }
        
        @if (showHome()) {
          <button nz-button [routerLink]="['/']">
            <span nz-icon nzType="home"></span>
            Go Home
          </button>
        }
        
        <ng-content select="[actions]" />
      </div>
      
      <div nz-result-content>
        <ng-content />
      </div>
    </nz-result>
  `
})
export class ResultComponent {
  status = input.required<ResultStatus>();
  title = input.required<string>();
  subtitle = input<string>();
  showRetry = input<boolean>(false);
  showHome = input<boolean>(true);
  
  retry = output<void>();
}
```

**Usage**:
```typescript
// Success result
<app-result
  status="success"
  title="Blueprint Created"
  subtitle="Your blueprint has been successfully created."
  [showRetry]="false">
  <div actions>
    <button nz-button nzType="primary" [routerLink]="['/blueprint', blueprint.id]">
      View Blueprint
    </button>
  </div>
</app-result>

// Error result
<app-result
  status="error"
  title="Failed to Load Data"
  subtitle="An error occurred while loading the data."
  [showRetry]="true"
  (retry)="loadData()">
</app-result>
```

### ExceptionComponent

**Purpose**: Display common exception pages (403, 404, 500)  
**Location**: `src/app/shared/components/exception/exception.component.ts`

```typescript
@Component({
  selector: 'app-exception',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <app-result
      [status]="type()"
      [title]="getTitle()"
      [subtitle]="getSubtitle()">
      <ng-content />
    </app-result>
  `
})
export class ExceptionComponent {
  type = input.required<'403' | '404' | '500'>();
  
  getTitle(): string {
    const titles = {
      '403': 'Access Denied',
      '404': 'Page Not Found',
      '500': 'Server Error'
    };
    return titles[this.type()];
  }
  
  getSubtitle(): string {
    const subtitles = {
      '403': 'Sorry, you don\'t have permission to access this page.',
      '404': 'Sorry, the page you visited does not exist.',
      '500': 'Sorry, something went wrong on our server.'
    };
    return subtitles[this.type()];
  }
}
```

**Usage**:
```typescript
<app-exception type="404">
  <div actions>
    <button nz-button nzType="primary" [routerLink]="['/']">
      Back Home
    </button>
  </div>
</app-exception>
```

## Custom Pipes

### SafePipe

**Purpose**: Sanitize HTML, URLs, and resource URLs  
**Location**: `src/app/shared/pipes/safe.pipe.ts`

```typescript
type SafeType = 'html' | 'style' | 'script' | 'url' | 'resourceUrl';

@Pipe({
  name: 'safe',
  standalone: true
})
export class SafePipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  
  transform(value: string, type: SafeType): SafeValue {
    switch (type) {
      case 'html':
        return this.sanitizer.sanitize(SecurityContext.HTML, value) || '';
      case 'style':
        return this.sanitizer.sanitize(SecurityContext.STYLE, value) || '';
      case 'script':
        return this.sanitizer.sanitize(SecurityContext.SCRIPT, value) || '';
      case 'url':
        return this.sanitizer.sanitize(SecurityContext.URL, value) || '';
      case 'resourceUrl':
        return this.sanitizer.sanitize(SecurityContext.RESOURCE_URL, value) || '';
      default:
        return value;
    }
  }
}
```

**Usage**:
```html
<!-- Sanitize HTML -->
<div [innerHTML]="htmlContent | safe:'html'"></div>

<!-- Sanitize URL -->
<a [href]="externalUrl | safe:'url'">Link</a>

<!-- Sanitize Resource URL (for iframes, etc.) -->
<iframe [src]="videoUrl | safe:'resourceUrl'"></iframe>
```

### TimeAgoPipe

**Purpose**: Display relative time (e.g., "2 hours ago")  
**Location**: `src/app/shared/pipes/time-ago.pipe.ts`

```typescript
@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return interval === 1 
          ? `1 ${unit} ago` 
          : `${interval} ${unit}s ago`;
      }
    }
    
    return 'just now';
  }
}
```

**Usage**:
```html
<span>Created {{ blueprint.created_at | timeAgo }}</span>
<!-- Output: Created 2 hours ago -->
```

### FileSizePipe

**Purpose**: Format byte sizes to human-readable format  
**Location**: `src/app/shared/pipes/file-size.pipe.ts`

```typescript
@Pipe({
  name: 'fileSize',
  standalone: true
})
export class FileSizePipe implements PipeTransform {
  transform(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
```

**Usage**:
```html
<span>File size: {{ file.size | fileSize }}</span>
<!-- Output: File size: 2.5 MB -->
```

## Custom Directives

### PermissionDirective

**Purpose**: Show/hide elements based on user permissions  
**Location**: `src/app/shared/directives/permission.directive.ts`

```typescript
@Directive({
  selector: '[appPermission]',
  standalone: true
})
export class PermissionDirective implements OnInit {
  private permission = input.required<string>({ alias: 'appPermission' });
  private blueprintId = input.required<string>({ alias: 'appPermissionBlueprintId' });
  
  private permissionService = inject(PermissionService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  
  async ngOnInit() {
    const hasPermission = await this.checkPermission();
    
    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
  
  private async checkPermission(): Promise<boolean> {
    const permission = this.permission();
    const blueprintId = this.blueprintId();
    
    switch (permission) {
      case 'read':
        return this.permissionService.canRead(blueprintId);
      case 'edit':
        return this.permissionService.canEdit(blueprintId);
      case 'delete':
        return this.permissionService.canDelete(blueprintId);
      case 'manageMembers':
        return this.permissionService.canManageMembers(blueprintId);
      case 'manageSettings':
        return this.permissionService.canManageSettings(blueprintId);
      default:
        return false;
    }
  }
}
```

**Usage**:
```html
<!-- Show edit button only if user has edit permission -->
<button 
  *appPermission="'edit'; blueprintId: blueprint.id"
  nz-button 
  (click)="edit()">
  Edit
</button>

<!-- Show delete button only if user has delete permission -->
<button 
  *appPermission="'delete'; blueprintId: blueprint.id"
  nz-button 
  nzDanger
  (click)="delete()">
  Delete
</button>
```

### AutoFocusDirective

**Purpose**: Automatically focus element on load  
**Location**: `src/app/shared/directives/auto-focus.directive.ts`

```typescript
@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements AfterViewInit {
  private delay = input<number>(0, { alias: 'appAutoFocus' });
  private elementRef = inject(ElementRef);
  
  ngAfterViewInit() {
    const delay = this.delay();
    
    if (delay > 0) {
      setTimeout(() => this.focus(), delay);
    } else {
      this.focus();
    }
  }
  
  private focus() {
    this.elementRef.nativeElement.focus();
  }
}
```

**Usage**:
```html
<!-- Auto-focus immediately -->
<input nz-input appAutoFocus />

<!-- Auto-focus after 300ms delay -->
<input nz-input [appAutoFocus]="300" />
```

## Utility Functions

### Date Utils

**Location**: `src/app/shared/utils/date.utils.ts`

```typescript
export class DateUtils {
  static formatDate(date: string | Date, format: string = 'yyyy-MM-dd'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Implementation using date-fns or moment.js
    return format; // placeholder
  }
  
  static isToday(date: string | Date): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }
  
  static isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }
  
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  static diffInDays(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
```

### String Utils

**Location**: `src/app/shared/utils/string.utils.ts`

```typescript
export class StringUtils {
  static truncate(str: string, length: number, suffix: string = '...'): string {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }
  
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  static camelToKebab(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  static kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
  
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  static isEmail(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }
  
  static isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }
}
```

### Array Utils

**Location**: `src/app/shared/utils/array.utils.ts`

```typescript
export class ArrayUtils {
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }
  
  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const group = String(item[key]);
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }
  
  static sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  static intersection<T>(...arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    return arrays.reduce((acc, arr) => 
      acc.filter(item => arr.includes(item))
    );
  }
  
  static difference<T>(array1: T[], array2: T[]): T[] {
    return array1.filter(item => !array2.includes(item));
  }
}
```

## Best Practices

### Component Design
1. **Keep components small and focused** - Single responsibility
2. **Use input/output signals** for component communication (Angular ≥19)
3. **Prefer composition over inheritance** - Reuse via composition
4. **Make components configurable** - Use inputs for customization
5. **Document component APIs** - Clear JSDoc comments

### Pipe Design
1. **Keep pipes pure** - No side effects
2. **Optimize for performance** - Cache results when possible
3. **Handle null/undefined** - Always provide fallback
4. **Use descriptive names** - Clear transformation purpose
5. **Make pipes reusable** - Generic when possible

### Directive Design
1. **Single purpose** - One responsibility per directive
2. **Use input signals** - For Angular ≥19
3. **Clean up subscriptions** - Use takeUntilDestroyed()
4. **Document behavior** - Clear usage examples
5. **Handle edge cases** - Null/undefined inputs

### Utility Functions
1. **Pure functions** - No side effects
2. **Type-safe** - Proper TypeScript types
3. **Well-tested** - Unit tests for edge cases
4. **Documented** - JSDoc with examples
5. **Consistent naming** - Follow conventions

## Common Patterns

### Loading State
```typescript
@Component({
  template: `
    @if (loading()) {
      <nz-spin nzSimple />
    } @else if (error()) {
      <app-result
        status="error"
        [title]="error()"
        [showRetry]="true"
        (retry)="load()" />
    } @else {
      <!-- Content -->
    }
  `
})
export class MyComponent {
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<any[]>([]);
  
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

### Confirmation Dialog
```typescript
async deleteItem(item: any) {
  const modal = this.modal.confirm({
    nzTitle: 'Confirm Delete',
    nzContent: `Are you sure you want to delete "${item.name}"?`,
    nzOkText: 'Delete',
    nzOkDanger: true,
    nzCancelText: 'Cancel'
  });
  
  modal.afterClose.subscribe(async (confirmed) => {
    if (confirmed) {
      await this.service.delete(item.id);
      this.message.success('Item deleted successfully');
      this.loadData();
    }
  });
}
```

### Form Validation
```typescript
form = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3)]],
  email: ['', [Validators.required, Validators.email]]
});

getErrorMessage(fieldName: string): string {
  const control = this.form.get(fieldName);
  if (!control?.errors) return '';
  
  if (control.errors['required']) return `${fieldName} is required`;
  if (control.errors['minlength']) {
    const min = control.errors['minlength'].requiredLength;
    return `${fieldName} must be at least ${min} characters`;
  }
  if (control.errors['email']) return 'Invalid email format';
  
  return 'Invalid input';
}
```

## Testing Shared Components

```typescript
describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PageHeaderComponent]
    });
    
    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
  });
  
  it('should display title', () => {
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.detectChanges();
    
    const title = fixture.nativeElement.querySelector('.ant-page-header-heading-title');
    expect(title.textContent).toContain('Test Title');
  });
  
  it('should emit back event', () => {
    let emitted = false;
    component.back.subscribe(() => emitted = true);
    
    component.onBack();
    expect(emitted).toBe(true);
  });
});
```

## Related Documentation

- **[Root AGENTS.md](../../AGENTS.md)** - Project-wide context
- **[Core Services](../core/AGENTS.md)** - Core infrastructure
- **[Blueprint Module](../routes/blueprint/AGENTS.md)** - Blueprint specifics

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
