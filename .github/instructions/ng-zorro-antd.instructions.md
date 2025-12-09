```instructions
---
description: 'ng-zorro-antd (Ant Design for Angular) development guidelines'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css, **/*.less'
---

# ng-zorro-antd Development Guidelines

Instructions for using ng-zorro-antd (Ant Design for Angular) in enterprise Angular applications.

## Overview

ng-zorro-antd is the Angular implementation of Ant Design, providing a comprehensive set of high-quality components for building rich, interactive user interfaces.

## Core Principles

- **Design Language**: Follow Ant Design specifications
- **Enterprise-Ready**: Optimized for admin and dashboard applications
- **Accessibility**: WCAG 2.1 compliant components
- **Internationalization**: Built-in i18n support
- **Customizable**: Extensive theming and configuration options
- **Performance**: Optimized for large-scale applications

## Component Usage Patterns

### Forms (nz-form)

**Reactive Forms Integration**:
```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>Username</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="Please input username!">
          <input nz-input formControlName="username" placeholder="Username" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>Email</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="Please input valid email!">
          <input nz-input formControlName="email" type="email" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-control [nzOffset]="6" [nzSpan]="14">
          <button nz-button nzType="primary" [disabled]="!form.valid">
            Submit
          </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  
  form: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });
  
  submit(): void {
    if (this.form.valid) {
      console.log(this.form.value);
    }
  }
}
```

### Tables (nz-table)

**Basic Table with Pagination**:
```typescript
import { Component, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-table 
      #table
      [nzData]="users()"
      [nzLoading]="loading()"
      [nzPageSize]="10"
      [nzShowSizeChanger]="true"
    >
      <thead>
        <tr>
          <th nzWidth="80px">ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th nzWidth="200px">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let user of table.data">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
          <td>
            <a (click)="edit(user)">Edit</a>
            <nz-divider nzType="vertical"></nz-divider>
            <a (click)="delete(user)">Delete</a>
          </td>
        </tr>
      </tbody>
    </nz-table>
  `
})
export class UserTableComponent {
  loading = signal(false);
  users = signal<User[]>([]);
}
```

### Modals (nz-modal)

**Service-Based Modals**:
```typescript
import { Component, inject } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <button nz-button (click)="showModal()">Open Modal</button>
  `
})
export class UserListComponent {
  private modal = inject(NzModalService);
  
  showModal(): void {
    this.modal.create({
      nzTitle: 'User Details',
      nzContent: UserDetailComponent,
      nzData: { userId: 123 },
      nzFooter: [
        {
          label: 'Cancel',
          onClick: () => this.modal.closeAll()
        },
        {
          label: 'Save',
          type: 'primary',
          onClick: () => this.save()
        }
      ]
    });
  }
}
```

### Messages & Notifications

**Message Service**:
```typescript
import { Component, inject } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-actions',
  template: `
    <button nz-button (click)="showSuccess()">Success</button>
    <button nz-button (click)="showError()">Error</button>
    <button nz-button (click)="showWarning()">Warning</button>
  `
})
export class ActionsComponent {
  private message = inject(NzMessageService);
  
  showSuccess(): void {
    this.message.success('Operation completed successfully!');
  }
  
  showError(): void {
    this.message.error('Operation failed!');
  }
  
  showWarning(): void {
    this.message.warning('Please check your input!');
  }
}
```

**Notification Service**:
```typescript
import { Component, inject } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-notifications',
  template: `
    <button nz-button (click)="showNotification()">Show Notification</button>
  `
})
export class NotificationsComponent {
  private notification = inject(NzNotificationService);
  
  showNotification(): void {
    this.notification.create(
      'success',
      'Notification Title',
      'This is the content of the notification.',
      { nzDuration: 4500 }
    );
  }
}
```

### Drawer (nz-drawer)

**Drawer for Side Panels**:
```typescript
import { Component, inject, signal } from '@angular/core';
import { NzDrawerService } from 'ng-zorro-antd/drawer';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <button nz-button (click)="openDrawer()">Open Drawer</button>
  `
})
export class MainComponent {
  private drawer = inject(NzDrawerService);
  
  openDrawer(): void {
    const drawerRef = this.drawer.create({
      nzTitle: 'User Settings',
      nzContent: UserSettingsComponent,
      nzWidth: 400,
      nzPlacement: 'right'
    });
    
    drawerRef.afterClose.subscribe(result => {
      console.log('Drawer closed with:', result);
    });
  }
}
```

### Upload (nz-upload)

**File Upload with Progress**:
```typescript
import { Component } from '@angular/core';
import { NzUploadFile, NzUploadChangeParam } from 'ng-zorro-antd/upload';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-upload
      nzAction="/api/upload"
      [nzHeaders]="headers"
      [nzFileList]="fileList"
      (nzChange)="handleChange($event)"
    >
      <button nz-button>
        <span nz-icon nzType="upload"></span>
        Click to Upload
      </button>
    </nz-upload>
  `
})
export class FileUploadComponent {
  fileList: NzUploadFile[] = [];
  headers = { authorization: 'Bearer xxx' };
  
  handleChange(info: NzUploadChangeParam): void {
    if (info.file.status === 'done') {
      console.log('Upload success:', info.file);
    } else if (info.file.status === 'error') {
      console.error('Upload failed:', info.file);
    }
  }
}
```

### Date Picker (nz-date-picker)

**Date Range Selection**:
```typescript
import { Component, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-date-filter',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-range-picker 
      [(ngModel)]="dateRange"
      (ngModelChange)="onDateChange($event)"
      [nzFormat]="'yyyy-MM-dd'"
    ></nz-range-picker>
  `
})
export class DateFilterComponent {
  dateRange = signal<Date[]>([]);
  
  onDateChange(dates: Date[]): void {
    console.log('Selected dates:', dates);
  }
}
```

### Select (nz-select)

**Select with Search and Tags**:
```typescript
import { Component, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-select',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-select
      [(ngModel)]="selectedUsers"
      nzMode="multiple"
      nzPlaceHolder="Select users"
      nzShowSearch
      [nzLoading]="loading()"
    >
      <nz-option 
        *ngFor="let user of users()" 
        [nzValue]="user.id" 
        [nzLabel]="user.name"
      ></nz-option>
    </nz-select>
  `
})
export class UserSelectComponent {
  loading = signal(false);
  users = signal<Array<{ id: number; name: string }>>([]);
  selectedUsers: number[] = [];
}
```

### Tree (nz-tree)

**Hierarchical Data Display**:
```typescript
import { Component, signal } from '@angular/core';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-organization-tree',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-tree
      [nzData]="nodes()"
      [nzCheckable]="true"
      [nzExpandedKeys]="expandedKeys"
      (nzClick)="onNodeClick($event)"
    ></nz-tree>
  `
})
export class OrganizationTreeComponent {
  nodes = signal<NzTreeNodeOptions[]>([
    {
      title: 'Root',
      key: '0',
      expanded: true,
      children: [
        { title: 'Child 1', key: '0-0', isLeaf: true },
        { title: 'Child 2', key: '0-1', isLeaf: true }
      ]
    }
  ]);
  
  expandedKeys = ['0'];
  
  onNodeClick(event: any): void {
    console.log('Node clicked:', event);
  }
}
```

## Layout Components

### Grid System (nz-row, nz-col)

**Responsive Grid Layout**:
```typescript
import { Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div nz-row [nzGutter]="16">
      <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8" [nzLg]="6">
        <nz-card nzTitle="Card 1">Content</nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8" [nzLg]="6">
        <nz-card nzTitle="Card 2">Content</nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8" [nzLg]="6">
        <nz-card nzTitle="Card 3">Content</nz-card>
      </div>
      <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8" [nzLg]="6">
        <nz-card nzTitle="Card 4">Content</nz-card>
      </div>
    </div>
  `
})
export class DashboardComponent {}
```

### Card (nz-card)

**Card with Actions**:
```typescript
import { Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-card 
      nzTitle="Project Name"
      [nzExtra]="extraTemplate"
      [nzActions]="[actionSetting, actionEdit, actionDelete]"
    >
      <p>Project description goes here...</p>
      
      <ng-template #extraTemplate>
        <a>More</a>
      </ng-template>
      
      <ng-template #actionSetting>
        <span nz-icon nzType="setting"></span>
      </ng-template>
      
      <ng-template #actionEdit>
        <span nz-icon nzType="edit"></span>
      </ng-template>
      
      <ng-template #actionDelete>
        <span nz-icon nzType="delete"></span>
      </ng-template>
    </nz-card>
  `
})
export class ProjectCardComponent {}
```

## Theming & Customization

### Custom Theme Variables

Create `src/styles/ng-zorro-theme.less`:
```less
// Primary color
@primary-color: #1890ff;

// Success color
@success-color: #52c41a;

// Warning color
@warning-color: #faad14;

// Error color
@error-color: #f5222d;

// Font
@font-size-base: 14px;
@font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

// Layout
@layout-header-height: 64px;
@layout-header-background: #001529;

// Border
@border-radius-base: 2px;

// Shadow
@shadow-1-up: 0 -2px 8px rgba(0, 0, 0, 0.09);
@shadow-1-down: 0 2px 8px rgba(0, 0, 0, 0.09);
```

Import in `angular.json`:
```json
{
  "styles": [
    "src/styles/ng-zorro-theme.less",
    "node_modules/ng-zorro-antd/ng-zorro-antd.less"
  ]
}
```

## Best Practices

### Component Selection
- Use `nz-table` for simple data display, `@delon/abc/st` for complex tables
- Use `nz-form` with reactive forms for type safety
- Use `nz-modal` service for dynamic modals
- Use `nz-drawer` for side panels and detail views
- Use `nz-card` for content containers

### Performance Optimization
- Use `nzVirtualScroll` for large lists
- Enable `OnPush` change detection
- Use `trackBy` functions in `*ngFor`
- Lazy load heavy components
- Debounce search inputs

### Accessibility
- Use semantic HTML with ng-zorro components
- Provide proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Follow WCAG 2.1 guidelines

### Responsive Design
- Use ng-zorro grid system (nz-row, nz-col)
- Define breakpoint-specific layouts
- Test on multiple screen sizes
- Use responsive utilities

### Error Handling
- Display user-friendly error messages
- Use `nz-message` for transient notifications
- Use `nz-notification` for persistent alerts
- Validate forms before submission
- Handle API errors gracefully

## Integration with ng-alain

ng-zorro-antd is the foundation for ng-alain. When using both:

1. **Import Order**: Import ng-zorro modules before ng-alain modules
2. **Shared Components**: Use SHARED_IMPORTS for common imports
3. **Consistent Styling**: Follow ng-alain's theming for consistency
4. **Component Choice**: Prefer @delon/abc components for complex scenarios
5. **Form Handling**: Use @delon/form for schema-driven forms, nz-form for custom forms

## Testing ng-zorro Components

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;
  let messageService: NzMessageService;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent],
      providers: [NzMessageService]
    }).compileComponents();
    
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    messageService = TestBed.inject(NzMessageService);
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should show success message', () => {
    spyOn(messageService, 'success');
    component.showSuccess();
    expect(messageService.success).toHaveBeenCalled();
  });
});
```

## Common Patterns

### Loading States
```typescript
loading = signal(false);

async loadData(): Promise<void> {
  this.loading.set(true);
  try {
    const data = await this.service.getData();
    this.data.set(data);
  } catch (error) {
    this.message.error('Failed to load data');
  } finally {
    this.loading.set(false);
  }
}
```

### Confirmation Dialogs
```typescript
confirmDelete(item: any): void {
  this.modal.confirm({
    nzTitle: 'Are you sure?',
    nzContent: 'This action cannot be undone.',
    nzOkText: 'Yes, delete',
    nzOkDanger: true,
    nzOnOk: () => this.delete(item)
  });
}
```

### Search with Debounce
```typescript
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

searchSubject = new Subject<string>();

ngOnInit(): void {
  this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged()
  ).subscribe(term => this.search(term));
}

onSearch(term: string): void {
  this.searchSubject.next(term);
}
```

## Additional Resources
- ng-zorro-antd Documentation: https://ng.ant.design
- Ant Design Specification: https://ant.design/docs/spec/introduce
- Component Demos: https://ng.ant.design/components
```
