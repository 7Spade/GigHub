# Azure Dragon Theme - Code Examples
# 青龍主題 - 程式碼範例

> **Version**: 1.1.0 | **Last Updated**: 2025-12-13

Complete code examples for implementing Azure Dragon theme in your Angular application.

---

## 📋 Table of Contents

1. [Component Examples](#component-examples)
2. [Layout Examples](#layout-examples)
3. [Form Examples](#form-examples)
4. [Data Display](#data-display)
5. [Utility Classes](#utility-classes)

---

## 🎨 Component Examples

### Buttons

```html
<!-- Primary Button with Gradient -->
<button nz-button nzType="primary">
  <i nz-icon nzType="check"></i>
  Submit
</button>

<!-- Success Button -->
<button nz-button nzType="primary" class="azure-btn-success">
  <i nz-icon nzType="check-circle"></i>
  Success
</button>

<!-- Info Button -->
<button nz-button nzType="default" class="azure-btn-info">
  <i nz-icon nzType="info-circle"></i>
  Info
</button>
```

```less
.azure-btn-success {
  background: @jade-4 !important;
  border-color: @jade-4 !important;
  
  &:hover, &:focus {
    background: @jade-5 !important;
    border-color: @jade-5 !important;
  }
}

.azure-btn-info {
  color: @cyan-3;
  border-color: @cyan-3;
  
  &:hover, &:focus {
    color: @cyan-4;
    border-color: @cyan-4;
    background: @cyan-1;
  }
}
```

### Cards

```html
<!-- Featured Card with Gradient -->
<nz-card class="azure-card-featured" [nzTitle]="'Featured Project'">
  <p>Important project details with gradient background</p>
  <button nz-button nzType="default">View Details</button>
</nz-card>

<!-- Standard Card with Hover Effect -->
<nz-card class="azure-card" [nzTitle]="'Project Overview'">
  <p>Regular project card with hover lift effect</p>
</nz-card>

<!-- Highlighted Card -->
<nz-card class="azure-card-highlight" [nzTitle]="'Attention Required'">
  <p>Card with accent border and light gradient background</p>
</nz-card>
```

```less
.azure-card {
  background: #ffffff;
  border: 1px solid @border-color-split;
  border-radius: 8px;
  box-shadow: @shadow-azure-sm;
  transition: all @transition-base;
  
  &:hover {
    box-shadow: @shadow-azure-lg;
    transform: translateY(-2px);
    border-color: @azure-6;
  }
}

.azure-card-featured {
  background: @gradient-dragon-soaring;
  color: #ffffff;
  border: none;
  box-shadow: @shadow-azure-lg;
  
  .ant-card-head-title {
    color: #ffffff;
  }
  
  .ant-btn-default {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    color: #ffffff;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.6);
    }
  }
}

.azure-card-highlight {
  background: @gradient-dawn-light;
  border: 2px solid @azure-6;
  box-shadow: @shadow-azure-md;
}
```

---

## 🏗️ Layout Examples

### Header with Gradient

```typescript
@Component({
  selector: 'app-layout-header',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <header class="azure-header">
      <div class="logo">
        <img src="assets/logo.svg" alt="Logo">
      </div>
      <nav class="nav-menu">
        <a nz-button nzType="text">Dashboard</a>
        <a nz-button nzType="text">Projects</a>
        <a nz-button nzType="text">Settings</a>
      </nav>
    </header>
  `,
  styles: [`
    .azure-header {
      background: linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%);
      box-shadow: 0 4px 6px rgba(14, 165, 233, 0.1);
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }
    
    .logo img {
      height: 40px;
    }
    
    .nav-menu a {
      color: rgba(255, 255, 255, 0.9);
      margin-left: 16px;
      
      &:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
      }
    }
  `]
})
export class LayoutHeaderComponent {}
```

### Sidebar Navigation

```typescript
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <aside class="azure-sidebar">
      <ul nz-menu nzMode="inline" class="azure-menu">
        <li nz-menu-item nzSelected>
          <i nz-icon nzType="dashboard"></i>
          <span>Dashboard</span>
        </li>
        <li nz-menu-item>
          <i nz-icon nzType="project"></i>
          <span>Projects</span>
        </li>
        <li nz-submenu nzTitle="Settings" nzIcon="setting">
          <ul>
            <li nz-menu-item>Profile</li>
            <li nz-menu-item>Preferences</li>
          </ul>
        </li>
      </ul>
    </aside>
  `,
  styles: [`
    .azure-sidebar {
      width: 200px;
      background: #ffffff;
      border-right: 1px solid #E2E8F0;
    }
  `]
})
export class SidebarComponent {}
```

---

## 📝 Form Examples

### Login Form

```typescript
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="azure-login-container">
      <nz-card class="azure-login-card">
        <h2>Login</h2>
        <form nz-form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <nz-form-item>
            <nz-form-control nzErrorTip="Please enter username">
              <nz-input-group nzPrefixIcon="user">
                <input nz-input formControlName="username" placeholder="Username">
              </nz-input-group>
            </nz-form-control>
          </nz-form-item>
          
          <nz-form-item>
            <nz-form-control nzErrorTip="Please enter password">
              <nz-input-group nzPrefixIcon="lock">
                <input nz-input type="password" formControlName="password" placeholder="Password">
              </nz-input-group>
            </nz-form-control>
          </nz-form-item>
          
          <button nz-button nzType="primary" nzBlock [nzLoading]="loading()">
            Login
          </button>
        </form>
      </nz-card>
    </div>
  `,
  styles: [`
    .azure-login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #E6F7FF 0%, #E0F7FA 50%, #E6FFF9 100%);
    }
    
    .azure-login-card {
      width: 400px;
      box-shadow: 0 10px 15px rgba(14, 165, 233, 0.15);
      
      h2 {
        text-align: center;
        color: #0EA5E9;
        margin-bottom: 24px;
      }
    }
  `]
})
export class LoginComponent {
  loading = signal(false);
  loginForm = inject(FormBuilder).group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });
  
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading.set(true);
      // Handle login
    }
  }
}
```

---

## 📊 Data Display

### Table with Azure Theme

```typescript
@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <st [data]="projects()" [columns]="columns" [loading]="loading()"></st>
  `
})
export class ProjectListComponent {
  loading = signal(false);
  projects = signal<Project[]>([]);
  
  columns: STColumn[] = [
    { title: 'ID', index: 'id', width: 80 },
    { title: 'Name', index: 'name' },
    { 
      title: 'Status', 
      index: 'status',
      type: 'badge',
      badge: {
        active: { text: 'Active', color: 'cyan' },
        completed: { text: 'Completed', color: 'green' },
        pending: { text: 'Pending', color: 'blue' }
      }
    },
    {
      title: 'Actions',
      buttons: [
        { 
          text: 'Edit', 
          icon: 'edit',
          type: 'link',
          click: (record: any) => this.edit(record) 
        },
        { 
          text: 'Delete', 
          icon: 'delete',
          type: 'link',
          pop: true,
          popTitle: 'Confirm delete?',
          click: (record: any) => this.delete(record) 
        }
      ]
    }
  ];
  
  edit(record: any): void {
    console.log('Edit:', record);
  }
  
  delete(record: any): void {
    console.log('Delete:', record);
  }
}
```

---

## 🎨 Utility Classes

### Background Classes

```html
<div class="azure-bg-primary">Primary Azure background</div>
<div class="azure-bg-gradient">Dragon Soaring gradient</div>
<div class="azure-bg-gradient-sky">Azure Sky gradient</div>
<div class="azure-bg-light">Light Azure background</div>
```

### Text Classes

```html
<span class="azure-text-primary">Azure Dragon Blue text</span>
<span class="azure-text-jade">Jade Green text</span>
<span class="azure-text-cyan">Cyan text</span>
```

### Border Classes

```html
<div class="azure-border-primary">Azure border</div>
<div class="azure-border-jade">Jade border</div>
```

### Animation Classes

```html
<!-- Dragon Flow Animation -->
<div class="dragon-effect">
  Animated gradient background
</div>

<!-- Pulse Effect -->
<button nz-button nzType="primary" class="dragon-pulse">
  Pulsing Button
</button>

<!-- Glow Effects -->
<div class="azure-glow">Azure glow effect</div>
<div class="jade-glow">Jade glow effect</div>
```

---

## 📚 Complete Component Example

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { STColumn } from '@delon/abc/st';

interface Task {
  id: number;
  title: string;
  status: 'pending' | 'active' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-task-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="azure-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <h1>Task Dashboard</h1>
        <button nz-button nzType="primary" (click)="addTask()">
          <i nz-icon nzType="plus"></i>
          Add Task
        </button>
      </div>
      
      <!-- Statistics Cards -->
      <div class="stats-grid">
        <nz-card class="stat-card azure-card">
          <nz-statistic 
            [nzValue]="totalTasks()" 
            [nzTitle]="'Total Tasks'"
            [nzPrefix]="totalIcon">
          </nz-statistic>
        </nz-card>
        
        <nz-card class="stat-card azure-card-highlight">
          <nz-statistic 
            [nzValue]="activeTasks()" 
            [nzTitle]="'Active Tasks'"
            [nzValueStyle]="{ color: '#0EA5E9' }">
          </nz-statistic>
        </nz-card>
        
        <nz-card class="stat-card azure-card">
          <nz-statistic 
            [nzValue]="completedTasks()" 
            [nzTitle]="'Completed'"
            [nzValueStyle]="{ color: '#14B8A6' }">
          </nz-statistic>
        </nz-card>
      </div>
      
      <!-- Tasks Table -->
      <nz-card class="azure-card">
        <st [data]="tasks()" [columns]="columns" [loading]="loading()"></st>
      </nz-card>
    </div>
    
    <ng-template #totalIcon>
      <i nz-icon nzType="appstore" style="color: #0EA5E9;"></i>
    </ng-template>
  `,
  styles: [`
    .azure-dashboard {
      padding: 24px;
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      h1 {
        margin: 0;
        color: #0EA5E9;
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      transition: all 0.3s ease;
    }
  `]
})
export class TaskDashboardComponent {
  loading = signal(false);
  tasks = signal<Task[]>([
    { id: 1, title: 'Design homepage', status: 'active', priority: 'high' },
    { id: 2, title: 'Implement login', status: 'completed', priority: 'medium' },
    { id: 3, title: 'Write tests', status: 'pending', priority: 'low' }
  ]);
  
  totalTasks = computed(() => this.tasks().length);
  activeTasks = computed(() => this.tasks().filter(t => t.status === 'active').length);
  completedTasks = computed(() => this.tasks().filter(t => t.status === 'completed').length);
  
  columns: STColumn[] = [
    { title: 'ID', index: 'id', width: 80 },
    { title: 'Title', index: 'title' },
    { 
      title: 'Status', 
      index: 'status',
      type: 'badge',
      badge: {
        pending: { text: 'Pending', color: 'default' },
        active: { text: 'Active', color: 'processing' },
        completed: { text: 'Completed', color: 'success' }
      }
    },
    {
      title: 'Priority',
      index: 'priority',
      type: 'tag',
      tag: {
        low: { text: 'Low', color: 'default' },
        medium: { text: 'Medium', color: 'blue' },
        high: { text: 'High', color: 'red' }
      }
    }
  ];
  
  addTask(): void {
    console.log('Add new task');
  }
}
```

---

**Theme Version**: 1.1.0  
**Compatible**: Angular 20+, ng-zorro-antd 20+, ng-alain 20+  
**Last Updated**: December 2025
