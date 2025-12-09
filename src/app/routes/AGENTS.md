# Routes Module Agent Guide

The Routes module organizes all feature modules in the GigHub application using lazy-loading for optimal performance.

## Module Purpose

The routes directory contains:
- **Feature modules** organized by business domain
- **Lazy-loaded routes** for performance optimization
- **Module-level guards** for access control
- **Nested routing** for complex features
- **Module-specific AGENTS.md** for detailed context

## Routes Structure

```
src/app/routes/
├── routes.ts                   # Main routing configuration
├── blueprint/                  # Blueprint container module (AGENTS.md)
│   ├── blueprint-list.component.ts
│   ├── blueprint-detail.component.ts
│   ├── blueprint-modal.component.ts
│   ├── members/                # Member management
│   ├── audit/                  # Audit logs
│   └── routes.ts
├── dashboard/                  # Dashboard views
│   ├── workplace/              # Main workplace dashboard
│   ├── analysis/               # Analytics dashboard
│   ├── monitor/                # Monitoring dashboard
│   └── routes.ts
├── passport/                   # Authentication flows
│   ├── login/                  # Login page
│   ├── register/               # Registration
│   ├── lock/                   # Lock screen
│   └── routes.ts
└── exception/                  # Error pages
    ├── 403.component.ts        # Forbidden
    ├── 404.component.ts        # Not Found
    ├── 500.component.ts        # Server Error
    └── routes.ts
```

## Main Routing Configuration

**Location**: `src/app/routes/routes.ts`

```typescript
export const routes: Routes = [
  {
    path: '',
    component: LayoutBasicComponent,
    canActivate: [authGuard],
    children: [
      // Dashboard (default route)
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/routes').then(m => m.routes),
        data: { title: 'Dashboard' }
      },
      
      // Blueprint module (Container Layer)
      {
        path: 'blueprint',
        loadChildren: () => import('./blueprint/routes').then(m => m.routes),
        data: { title: 'Blueprints' }
      },
      
      // Business Layer modules (lazy-loaded when Blueprint enables them)
      {
        path: 'blueprint/:blueprintId/tasks',
        canActivate: [moduleEnabledGuard('task')],
        loadChildren: () => import('./task/routes').then(m => m.routes),
        data: { title: 'Tasks', module: 'task' }
      },
      {
        path: 'blueprint/:blueprintId/diary',
        canActivate: [moduleEnabledGuard('diary')],
        loadChildren: () => import('./diary/routes').then(m => m.routes),
        data: { title: 'Construction Diary', module: 'diary' }
      },
      {
        path: 'blueprint/:blueprintId/quality',
        canActivate: [moduleEnabledGuard('quality')],
        loadChildren: () => import('./quality/routes').then(m => m.routes),
        data: { title: 'Quality Control', module: 'quality' }
      },
      {
        path: 'blueprint/:blueprintId/financial',
        canActivate: [moduleEnabledGuard('financial')],
        loadChildren: () => import('./financial/routes').then(m => m.routes),
        data: { title: 'Financial', module: 'financial' }
      }
    ]
  },
  
  // Authentication routes (no auth required)
  {
    path: 'passport',
    component: LayoutPassportComponent,
    children: [
      {
        path: 'login',
        loadChildren: () => import('./passport/login/routes').then(m => m.routes),
        data: { title: 'Login' }
      },
      {
        path: 'register',
        loadChildren: () => import('./passport/register/routes').then(m => m.routes),
        data: { title: 'Register' }
      },
      {
        path: 'lock',
        loadChildren: () => import('./passport/lock/routes').then(m => m.routes),
        data: { title: 'Lock Screen' }
      }
    ]
  },
  
  // Exception routes
  {
    path: 'exception',
    loadChildren: () => import('./exception/routes').then(m => m.routes)
  },
  
  // Catch-all route
  {
    path: '**',
    redirectTo: 'exception/404'
  }
];
```

## Feature Module Patterns

### Module Routing Template

Each feature module should follow this pattern:

```typescript
// src/app/routes/[module-name]/routes.ts
import { Routes } from '@angular/router';
import { permissionGuard } from '@core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    component: ModuleListComponent,
    data: { title: 'Module List' }
  },
  {
    path: ':id',
    component: ModuleDetailComponent,
    canActivate: [permissionGuard('read')],
    data: { title: 'Module Detail' }
  },
  {
    path: ':id/edit',
    component: ModuleEditComponent,
    canActivate: [permissionGuard('edit')],
    data: { title: 'Edit Module' }
  }
];
```

### Lazy Loading Benefits

1. **Smaller initial bundle** - Only load dashboard & auth initially
2. **Faster initial load** - Reduced time to interactive
3. **On-demand loading** - Load features when needed
4. **Better code splitting** - Webpack creates separate chunks
5. **Improved caching** - Unchanged modules stay cached

### Route Data

Use route `data` to pass configuration:

```typescript
{
  path: 'blueprint',
  data: {
    title: 'Blueprints',              // Page title
    breadcrumb: 'Blueprints',         // Breadcrumb label
    permission: 'read_blueprint',     // Required permission
    module: 'blueprint',              // Module ID (for feature flags)
    showInMenu: true,                 // Show in sidebar menu
    icon: 'project',                  // Menu icon
    order: 10                         // Menu order
  }
}
```

## Route Guards

### Authentication Guard

**Protects routes requiring login**:
```typescript
{
  path: 'dashboard',
  canActivate: [authGuard],
  loadChildren: () => import('./dashboard/routes')
}
```

### Permission Guard

**Protects routes based on permissions**:
```typescript
{
  path: 'blueprint/:id',
  canActivate: [permissionGuard('read')],
  component: BlueprintDetailComponent
}
```

### Module Enabled Guard

**Ensures blueprint has module enabled**:
```typescript
{
  path: 'blueprint/:blueprintId/tasks',
  canActivate: [moduleEnabledGuard('task')],
  loadChildren: () => import('./task/routes')
}
```

### Guard Composition

**Combine multiple guards**:
```typescript
{
  path: 'blueprint/:blueprintId/tasks/:id/edit',
  canActivate: [
    authGuard,                        // Must be logged in
    permissionGuard('edit'),          // Must have edit permission
    moduleEnabledGuard('task')        // Task module must be enabled
  ],
  component: TaskEditComponent
}
```

## Module Organization

### Foundation Layer Routes

**Account & Organization Management**:
- `/account/profile` - User profile
- `/account/settings` - User settings
- `/organization` - Organization list
- `/organization/:id` - Organization details
- `/organization/:id/teams` - Team management

### Container Layer Routes

**Blueprint Management**:
- `/blueprint` - Blueprint list
- `/blueprint/:id` - Blueprint details
- `/blueprint/:id/members` - Member management
- `/blueprint/:id/audit` - Audit logs
- `/blueprint/:id/settings` - Blueprint settings

### Business Layer Routes

**Blueprint-scoped Modules**:
- `/blueprint/:blueprintId/tasks` - Task management
- `/blueprint/:blueprintId/diary` - Construction diary
- `/blueprint/:blueprintId/quality` - Quality control
- `/blueprint/:blueprintId/financial` - Financial management
- `/blueprint/:blueprintId/files` - File management

## Navigation Patterns

### Hierarchical Navigation

```typescript
// From blueprint list to detail
router.navigate(['/blueprint', blueprintId]);

// From blueprint detail to tasks
router.navigate(['/blueprint', blueprintId, 'tasks']);

// From task list to task detail
router.navigate(['/blueprint', blueprintId, 'tasks', taskId]);
```

### Relative Navigation

```typescript
// Navigate up one level
router.navigate(['../'], { relativeTo: this.route });

// Navigate to sibling route
router.navigate(['../audit'], { relativeTo: this.route });

// Navigate with query params
router.navigate(['/blueprint'], {
  queryParams: { status: 'active', owner: 'me' }
});
```

### Programmatic Navigation

```typescript
@Component({...})
export class MyComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  goToBlueprint(id: string) {
    this.router.navigate(['/blueprint', id]);
  }
  
  goBack() {
    // Use browser back
    window.history.back();
    
    // Or navigate to parent
    this.router.navigate(['../'], { relativeTo: this.route });
  }
  
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
```

## Route Parameters

### Reading Route Parameters

```typescript
@Component({...})
export class BlueprintDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  blueprintId = signal<string>('');
  
  ngOnInit() {
    // Using snapshot (one-time read)
    this.blueprintId.set(this.route.snapshot.paramMap.get('id') || '');
    
    // Using observable (reactive)
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blueprintId.set(id);
        this.loadBlueprint(id);
      }
    });
  }
}
```

### Reading Query Parameters

```typescript
ngOnInit() {
  // Snapshot
  const status = this.route.snapshot.queryParamMap.get('status');
  
  // Observable
  this.route.queryParamMap.subscribe(params => {
    const status = params.get('status');
    const owner = params.get('owner');
    this.filterBlueprints(status, owner);
  });
}
```

## Breadcrumbs

### Dynamic Breadcrumbs

```typescript
@Component({...})
export class BlueprintDetailComponent {
  breadcrumbs = computed(() => {
    const blueprint = this.blueprint();
    return [
      { label: 'Home', path: '/' },
      { label: 'Blueprints', path: '/blueprint' },
      { label: blueprint?.name || 'Loading...', path: null }
    ];
  });
}
```

**Template**:
```html
<app-page-header
  [title]="blueprint()?.name"
  [breadcrumbs]="breadcrumbs()">
</app-page-header>
```

## Module-Specific AGENTS.md

Each major feature module should have its own `AGENTS.md`:

### Blueprint Module
**File**: `src/app/routes/blueprint/AGENTS.md`  
**Content**: Detailed context for blueprint management, permissions, members, audit logs

### Task Module (Future)
**File**: `src/app/routes/task/AGENTS.md`  
**Content**: Task management patterns, status workflows, assignments

### Diary Module (Future)
**File**: `src/app/routes/diary/AGENTS.md`  
**Content**: Daily log patterns, weather integration, photo uploads

### Quality Module (Future)
**File**: `src/app/routes/quality/AGENTS.md`  
**Content**: Inspection checklists, defect tracking, compliance

## Adding New Routes

### Step-by-Step Process

1. **Create module directory**:
   ```bash
   mkdir -p src/app/routes/my-module
   ```

2. **Create routes file**:
   ```typescript
   // src/app/routes/my-module/routes.ts
   export const routes: Routes = [
     {
       path: '',
       component: MyModuleListComponent
     }
   ];
   ```

3. **Create components**:
   ```bash
   ng generate component routes/my-module/my-module-list --standalone
   ```

4. **Register in main routes**:
   ```typescript
   // src/app/routes/routes.ts
   {
     path: 'my-module',
     loadChildren: () => import('./my-module/routes').then(m => m.routes)
   }
   ```

5. **Add to sidebar menu** (if applicable):
   ```typescript
   // src/app/layout/basic/widgets/sidebar/sidebar.component.ts
   {
     text: 'My Module',
     icon: 'icon-name',
     link: '/my-module'
   }
   ```

6. **Create AGENTS.md** (for complex modules):
   ```markdown
   # My Module Agent Guide
   
   ## Purpose
   ...
   
   ## Components
   ...
   ```

## Best Practices

### Route Design
1. **Use lazy loading** for all feature modules
2. **Keep route paths simple** and descriptive
3. **Use kebab-case** for route segments
4. **Nest related routes** logically
5. **Avoid deep nesting** (max 3-4 levels)

### Guards
1. **Order guards carefully** - Auth first, then permissions
2. **Cache permission checks** - Avoid repeated database queries
3. **Provide feedback** - Clear error messages on guard failure
4. **Test edge cases** - Handle missing IDs, expired sessions

### Navigation
1. **Use relative navigation** when possible
2. **Preserve query params** if needed: `{ queryParamsHandling: 'preserve' }`
3. **Handle navigation errors** - Catch router errors
4. **Provide loading states** - Show spinner during navigation

### Module Organization
1. **Group related features** in same directory
2. **Create module-level AGENTS.md** for complex features
3. **Use consistent naming** across modules
4. **Share common components** via shared module

## Troubleshooting

### Route Not Found
- Check route path spelling
- Verify module is registered in main routes
- Check if guard is blocking access
- Ensure lazy-loaded module exports routes

### Guard Blocking Access
- Verify user is authenticated
- Check user has required permission
- Ensure module is enabled in blueprint
- Check guard logic for bugs

### Breadcrumbs Not Showing
- Verify breadcrumb data in route config
- Check if component is using PageHeaderComponent
- Ensure breadcrumb items have correct format

### Module Not Loading
- Check browser console for errors
- Verify import path is correct
- Ensure module exports routes constant
- Check for circular dependencies

## Related Documentation

- **[Root AGENTS.md](../../AGENTS.md)** - Project-wide context
- **[Blueprint Module](./blueprint/AGENTS.md)** - Blueprint specifics
- **[Core Services](../core/AGENTS.md)** - Guards and services

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development
