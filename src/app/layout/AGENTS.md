# Layout Module Agent Guide

The Layout module provides different layout templates for various application contexts in GigHub.

## Module Purpose

The Layout module offers:
- **Basic Layout** - Main authenticated user interface with sidebar and header
- **Blank Layout** - Minimal layout for focused tasks
- **Passport Layout** - Authentication and onboarding flows
- **Responsive Design** - Mobile-first responsive layouts
- **Layout Switching** - Context-based layout selection via routing

## Module Structure

```
src/app/layout/
├── AGENTS.md                          # This file
├── index.ts                           # Public exports
├── basic/                             # Main app layout
│   ├── basic.component.ts             # Layout container
│   ├── basic.component.html           # Layout template
│   ├── basic.component.scss           # Layout styles
│   └── widgets/                       # Layout widgets
│       ├── header/                    # Top header bar
│       ├── sidebar/                   # Left sidebar menu
│       ├── user/                      # User dropdown
│       └── notification/              # Notification center
├── blank/                             # Minimal layout
│   ├── blank.component.ts             # Simple container
│   └── blank.component.html           # Minimal template
└── passport/                          # Auth layout
    ├── passport.component.ts          # Auth container
    ├── passport.component.html        # Auth template
    └── passport.component.scss        # Auth styles
```

## Layout Types

### Basic Layout (LayoutBasicComponent)

**Purpose**: Main application layout for authenticated users

**Features**:
- **Top Header Bar** - Logo, breadcrumbs, user menu, notifications
- **Left Sidebar** - Collapsible navigation menu with icons
- **Main Content Area** - Router outlet for feature modules
- **Footer** (optional) - Copyright and links
- **Responsive** - Collapses sidebar on mobile

**Usage**:
```typescript
// In routes.ts
{
  path: '',
  component: LayoutBasicComponent,
  canActivate: [authGuard],
  children: [
    { path: 'dashboard', loadChildren: () => import('./dashboard/routes') },
    { path: 'blueprint', loadChildren: () => import('./blueprint/routes') }
  ]
}
```

**Template Structure**:
```html
<nz-layout class="full-height">
  <!-- Sidebar -->
  <nz-sider
    [nzCollapsed]="isCollapsed()"
    [nzWidth]="240"
    [nzCollapsedWidth]="64">
    <app-sidebar [collapsed]="isCollapsed()" />
  </nz-sider>
  
  <!-- Main Content -->
  <nz-layout>
    <!-- Header -->
    <nz-header>
      <app-header
        (toggleSidebar)="toggleCollapsed()"
        (logout)="handleLogout()" />
    </nz-header>
    
    <!-- Content Area -->
    <nz-content class="content-area">
      <router-outlet />
    </nz-content>
    
    <!-- Footer (optional) -->
    <nz-footer>
      © 2025 GigHub. All Rights Reserved.
    </nz-footer>
  </nz-layout>
</nz-layout>
```

**State Management**:
```typescript
import { Component, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'layout-basic',
  standalone: true,
  imports: [SHARED_IMPORTS, HeaderComponent, SidebarComponent],
  templateUrl: './basic.component.html',
  styleUrl: './basic.component.scss'
})
export class LayoutBasicComponent {
  // Sidebar collapse state
  isCollapsed = signal(false);
  
  toggleCollapsed(): void {
    this.isCollapsed.update(collapsed => !collapsed);
  }
  
  handleLogout(): void {
    // Handled by HeaderComponent
  }
}
```

### Blank Layout (LayoutBlankComponent)

**Purpose**: Minimal layout for fullscreen or focused tasks

**Features**:
- **No header/sidebar** - Just content area
- **Simple container** - Minimal styling
- **Fullscreen capable** - No distractions

**Usage**:
```typescript
// For specific routes that need minimal UI
{
  path: 'preview',
  component: LayoutBlankComponent,
  children: [
    { path: ':id', component: PreviewComponent }
  ]
}
```

**Template**:
```html
<div class="blank-layout">
  <router-outlet />
</div>
```

**Implementation**:
```typescript
@Component({
  selector: 'layout-blank',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
    }
  `]
})
export class LayoutBlankComponent {}
```

### Passport Layout (LayoutPassportComponent)

**Purpose**: Authentication and onboarding layout

**Features**:
- **Centered content** - Focus on auth forms
- **Brand imagery** - Logo and marketing content
- **Form optimization** - Optimized for form entry
- **No navigation** - Clean, distraction-free

**Usage**:
```typescript
// For authentication routes
{
  path: 'passport',
  component: LayoutPassportComponent,
  children: [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'lock', component: LockComponent }
  ]
}
```

**Template Structure**:
```html
<div class="passport-layout">
  <div class="passport-container">
    <!-- Branding Section (left/top) -->
    <div class="passport-branding">
      <div class="logo">
        <img src="assets/logo.svg" alt="GigHub">
        <h1>GigHub</h1>
      </div>
      <p class="tagline">
        工地施工進度追蹤管理系統
      </p>
    </div>
    
    <!-- Form Section (right/bottom) -->
    <div class="passport-form">
      <router-outlet />
    </div>
  </div>
</div>
```

**Styling**:
```scss
.passport-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  .passport-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    max-width: 1000px;
    width: 100%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
  
  .passport-branding {
    padding: 60px;
    background: #f7fafc;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .passport-form {
    padding: 60px;
  }
}
```

## Layout Widgets

### Header Component

**Purpose**: Top navigation bar with user menu and actions

**File**: `basic/widgets/header/header.component.ts`

**Features**:
- **Logo/Brand** - Clickable logo to home
- **Breadcrumbs** - Dynamic navigation path
- **Search** (optional) - Global search
- **Notifications** - Bell icon with badge
- **User Menu** - Avatar with dropdown (profile, settings, logout)
- **Theme Toggle** (optional) - Dark/light mode

**Implementation**:
```typescript
import { Component, output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';
import { FirebaseAuthService } from '@core/services/firebase-auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="header-container">
      <!-- Sidebar Toggle -->
      <button
        nz-button
        nzType="text"
        (click)="toggleSidebar.emit()">
        <span nz-icon nzType="menu-fold"></span>
      </button>
      
      <!-- Breadcrumbs -->
      <nz-breadcrumb>
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
      
      <div class="spacer"></div>
      
      <!-- Notifications -->
      <button
        nz-button
        nzType="text"
        nz-dropdown
        [nzDropdownMenu]="notificationMenu">
        <nz-badge [nzCount]="notificationCount()">
          <span nz-icon nzType="bell"></span>
        </nz-badge>
      </button>
      
      <!-- User Menu -->
      <div class="user-menu">
        <nz-avatar
          [nzSrc]="userAvatar()"
          [nzText]="userInitial()"
          nz-dropdown
          [nzDropdownMenu]="userDropdown">
        </nz-avatar>
        
        <nz-dropdown-menu #userDropdown="nzDropdownMenu">
          <ul nz-menu>
            <li nz-menu-item (click)="navigateToProfile()">
              <span nz-icon nzType="user"></span>
              Profile
            </li>
            <li nz-menu-item (click)="navigateToSettings()">
              <span nz-icon nzType="setting"></span>
              Settings
            </li>
            <li nz-menu-divider></li>
            <li nz-menu-item (click)="handleLogout()">
              <span nz-icon nzType="logout"></span>
              Logout
            </li>
          </ul>
        </nz-dropdown-menu>
      </div>
    </div>
  `,
  styles: [`
    .header-container {
      display: flex;
      align-items: center;
      gap: 16px;
      height: 64px;
      padding: 0 24px;
      background: #fff;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .spacer {
      flex: 1;
    }
    
    .user-menu {
      cursor: pointer;
    }
  `]
})
export class HeaderComponent {
  toggleSidebar = output<void>();
  logout = output<void>();
  
  private auth = inject(FirebaseAuthService);
  private router = inject(Router);
  
  breadcrumbs = signal([
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: null }
  ]);
  
  notificationCount = signal(3);
  userAvatar = signal('');
  userInitial = signal('U');
  
  navigateToProfile(): void {
    this.router.navigate(['/account/profile']);
  }
  
  navigateToSettings(): void {
    this.router.navigate(['/account/settings']);
  }
  
  async handleLogout(): Promise<void> {
    await this.auth.signOut();
    this.logout.emit();
  }
}
```

### Sidebar Component

**Purpose**: Left navigation menu with hierarchical structure

**File**: `basic/widgets/sidebar/sidebar.component.ts`

**Features**:
- **Menu Items** - Icon + label navigation
- **Sub-menus** - Expandable nested menus
- **Active Indicator** - Highlights current route
- **Collapse Support** - Shows only icons when collapsed
- **Permission-based** - Hides items user can't access

**Menu Structure**:
```typescript
interface MenuItem {
  text: string;
  icon: string;
  link?: string;
  badge?: number | string;
  children?: MenuItem[];
  permission?: string;
}

const menuItems: MenuItem[] = [
  {
    text: 'Dashboard',
    icon: 'dashboard',
    link: '/dashboard'
  },
  {
    text: 'Blueprints',
    icon: 'project',
    link: '/blueprint'
  },
  {
    text: 'Organization',
    icon: 'team',
    children: [
      { text: 'Overview', icon: 'info-circle', link: '/organization' },
      { text: 'Teams', icon: 'team', link: '/organization/teams' },
      { text: 'Members', icon: 'user', link: '/organization/members' }
    ]
  },
  {
    text: 'Settings',
    icon: 'setting',
    link: '/settings',
    permission: 'admin'
  }
];
```

**Implementation**:
```typescript
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="sidebar-container">
      <!-- Logo -->
      <div class="sidebar-logo" [class.collapsed]="collapsed()">
        @if (!collapsed()) {
          <img src="assets/logo.svg" alt="GigHub">
          <span>GigHub</span>
        } @else {
          <img src="assets/logo-icon.svg" alt="G">
        }
      </div>
      
      <!-- Menu -->
      <ul nz-menu
          nzMode="inline"
          [nzInlineCollapsed]="collapsed()"
          [nzTheme]="'dark'">
        @for (item of filteredMenuItems(); track item.text) {
          @if (item.children) {
            <!-- Submenu -->
            <li nz-submenu
                [nzTitle]="item.text"
                [nzIcon]="item.icon">
              <ul>
                @for (child of item.children; track child.text) {
                  <li nz-menu-item
                      [routerLink]="child.link"
                      routerLinkActive="ant-menu-item-selected">
                    <span nz-icon [nzType]="child.icon"></span>
                    <span>{{ child.text }}</span>
                  </li>
                }
              </ul>
            </li>
          } @else {
            <!-- Single item -->
            <li nz-menu-item
                [routerLink]="item.link"
                routerLinkActive="ant-menu-item-selected">
              <span nz-icon [nzType]="item.icon"></span>
              <span>{{ item.text }}</span>
              @if (item.badge) {
                <nz-badge [nzCount]="item.badge" />
              }
            </li>
          }
        }
      </ul>
    </div>
  `
})
export class SidebarComponent {
  collapsed = input<boolean>(false);
  
  private permissionService = inject(PermissionService);
  
  menuItems = signal<MenuItem[]>(menuItems);
  
  // Filter menu items based on permissions
  filteredMenuItems = computed(() => {
    return this.menuItems().filter(item => {
      if (!item.permission) return true;
      return this.permissionService.hasPermission(item.permission);
    });
  });
}
```

### Notification Component

**Purpose**: Notification center dropdown

**Features**:
- **Badge Count** - Shows unread count
- **Notification List** - Recent notifications
- **Mark as Read** - Individual or bulk actions
- **Filter** - By type or date
- **Real-time Updates** - Firestore subscriptions

**Implementation**:
```typescript
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-dropdown-menu #notificationMenu="nzDropdownMenu">
      <div class="notification-dropdown">
        <div class="notification-header">
          <h4>Notifications</h4>
          <a (click)="markAllAsRead()">Mark all as read</a>
        </div>
        
        <div class="notification-list">
          @for (notif of notifications(); track notif.id) {
            <div class="notification-item" [class.unread]="!notif.read">
              <nz-avatar [nzIcon]="notif.icon" [nzStyle]="{ backgroundColor: notif.color }" />
              <div class="notification-content">
                <p class="title">{{ notif.title }}</p>
                <p class="description">{{ notif.description }}</p>
                <span class="time">{{ notif.timestamp | timeAgo }}</span>
              </div>
              @if (!notif.read) {
                <button nz-button nzType="text" (click)="markAsRead(notif)">
                  <span nz-icon nzType="check"></span>
                </button>
              }
            </div>
          }
          
          @if (notifications().length === 0) {
            <nz-empty nzNotFoundContent="No notifications" />
          }
        </div>
        
        <div class="notification-footer">
          <a [routerLink]="['/notifications']">View all notifications</a>
        </div>
      </div>
    </nz-dropdown-menu>
  `
})
export class NotificationComponent {
  notifications = signal<Notification[]>([]);
  
  async markAsRead(notif: Notification): Promise<void> {
    // Update notification status
  }
  
  async markAllAsRead(): Promise<void> {
    // Mark all as read
  }
}
```

## Responsive Design

### Breakpoints

```scss
// Mobile First
$breakpoint-xs: 0;      // Extra small devices (phones)
$breakpoint-sm: 576px;  // Small devices (phones landscape)
$breakpoint-md: 768px;  // Medium devices (tablets)
$breakpoint-lg: 992px;  // Large devices (desktops)
$breakpoint-xl: 1200px; // Extra large devices (large desktops)
$breakpoint-xxl: 1600px; // XXL devices (ultra-wide)
```

### Mobile Behavior

**Sidebar**:
- **Desktop (≥992px)**: Persistent sidebar, collapsible
- **Tablet (768px-991px)**: Collapsible sidebar, overlay
- **Mobile (<768px)**: Hidden by default, drawer overlay

**Header**:
- **Desktop**: Full breadcrumbs, all icons visible
- **Tablet**: Shortened breadcrumbs, essential icons
- **Mobile**: Hamburger menu, user avatar only

**Content**:
- **All sizes**: Fluid width with max constraints
- **Mobile**: Increased padding, larger tap targets

### Implementation

```typescript
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({...})
export class LayoutBasicComponent {
  private breakpointObserver = inject(BreakpointObserver);
  
  isMobile = signal(false);
  isTablet = signal(false);
  
  constructor() {
    // Observe breakpoints
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });
      
    this.breakpointObserver
      .observe([Breakpoints.Tablet])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        this.isTablet.set(result.matches);
      });
  }
  
  // Auto-collapse sidebar on mobile
  sidebarMode = computed(() => {
    return this.isMobile() ? 'over' : 'side';
  });
}
```

## Layout Switching

### Route-Based Layout Selection

```typescript
// routes.ts
export const routes: Routes = [
  // Basic Layout (authenticated routes)
  {
    path: '',
    component: LayoutBasicComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('./dashboard/routes') },
      { path: 'blueprint', loadChildren: () => import('./blueprint/routes') }
    ]
  },
  
  // Passport Layout (auth routes)
  {
    path: 'passport',
    component: LayoutPassportComponent,
    children: [
      { path: 'login', loadChildren: () => import('./passport/login/routes') },
      { path: 'register', loadChildren: () => import('./passport/register/routes') }
    ]
  },
  
  // Blank Layout (special routes)
  {
    path: 'preview',
    component: LayoutBlankComponent,
    children: [
      { path: ':id', component: PreviewComponent }
    ]
  }
];
```

## Theme Support

### ng-zorro-antd Theming

```typescript
// app.config.ts
import { provideNzConfig } from 'ng-zorro-antd/core/config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNzConfig({
      theme: {
        primaryColor: '#1890ff',
        errorColor: '#ff4d4f',
        warningColor: '#faad14',
        successColor: '#52c41a',
        infoColor: '#1890ff'
      }
    })
  ]
};
```

### Dark Mode (Optional)

```typescript
export class ThemeService {
  private darkMode = signal(false);
  
  toggleDarkMode(): void {
    this.darkMode.update(dark => !dark);
    document.body.classList.toggle('dark-theme', this.darkMode());
  }
}
```

```scss
// Global dark theme styles
body.dark-theme {
  --background-color: #141414;
  --text-color: #ffffff;
  --border-color: #303030;
  
  .ant-layout {
    background: var(--background-color);
    color: var(--text-color);
  }
}
```

## Best Practices

### 1. Layout Components

- **Keep layouts simple** - Focus on structure, not business logic
- **Use signals** - For reactive UI state (collapsed, theme)
- **Extract widgets** - Reusable header, sidebar, footer components
- **Responsive first** - Mobile-first design approach

### 2. Performance

- **Lazy load layouts** - Load layout components on demand
- **OnPush detection** - All layout components use OnPush
- **Minimize re-renders** - Use signals for fine-grained updates
- **Virtual scrolling** - For long notification lists

### 3. Accessibility

- **Semantic HTML** - Use proper HTML5 elements
- **ARIA labels** - For icon-only buttons
- **Keyboard navigation** - Full keyboard support
- **Focus management** - Trap focus in modals/drawers
- **Screen reader** - Test with screen readers

### 4. State Management

- **Layout state** - Sidebar collapse, theme in signals
- **User state** - From FirebaseAuth
- **Notifications** - Real-time Firestore subscriptions
- **Preferences** - Persist in localStorage or Firestore

## Testing

### Unit Tests

```typescript
describe('LayoutBasicComponent', () => {
  it('should toggle sidebar', () => {
    const component = TestBed.createComponent(LayoutBasicComponent).componentInstance;
    const initialState = component.isCollapsed();
    
    component.toggleCollapsed();
    
    expect(component.isCollapsed()).toBe(!initialState);
  });
});
```

### E2E Tests

```typescript
test('sidebar navigation', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Blueprints');
  await expect(page).toHaveURL(/.*blueprint/);
});
```

## Troubleshooting

**Issue**: Sidebar not collapsing on mobile  
**Solution**: Check `BreakpointObserver` is correctly setting `isMobile` signal

**Issue**: User menu not showing  
**Solution**: Verify Firebase Auth is initialized and user is logged in

**Issue**: Notifications not updating  
**Solution**: Check Firestore subscription in `ngOnInit` with `takeUntilDestroyed()`

**Issue**: Layout flickering on route change  
**Solution**: Use `@defer` for lazy-loaded components

## Related Documentation

- **[App Module](../AGENTS.md)** - Application bootstrap
- **[Routes](../routes/AGENTS.md)** - Feature modules
- **[Core Services](../core/AGENTS.md)** - Authentication
- **[Shared Components](../shared/AGENTS.md)** - Reusable UI

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Production Ready
