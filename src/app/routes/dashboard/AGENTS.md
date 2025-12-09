# Dashboard Module Agent Guide

The Dashboard module provides overview and analytics views for GigHub users.

## Module Purpose

The Dashboard module offers:
- **Workplace Dashboard** - Main entry point with key metrics and quick actions
- **Analysis Dashboard** - Data visualization and reporting
- **Monitor Dashboard** - Real-time system monitoring
- **Customizable Widgets** - User-configurable dashboard cards
- **Context-Aware Data** - Adapts to current user/organization/blueprint context

## Module Structure

```
src/app/routes/dashboard/
├── AGENTS.md                           # This file
├── routes.ts                           # Module routing
├── context-dashboard.component.ts      # Context switcher component
├── workplace/                          # Main workplace dashboard
│   ├── workplace.component.ts          # Dashboard container
│   ├── workplace.component.html        # Dashboard template
│   └── workplace.component.scss        # Dashboard styles
├── analysis/                           # Analysis & reporting
│   ├── analysis.component.ts           # Analytics view
│   └── charts/                         # Chart components
│       ├── task-chart.component.ts
│       ├── progress-chart.component.ts
│       └── quality-chart.component.ts
├── monitor/                            # System monitoring
│   ├── monitor.component.ts            # Monitor view
│   └── widgets/                        # Monitor widgets
│       ├── cpu-usage.component.ts
│       ├── memory-usage.component.ts
│       └── api-health.component.ts
└── v1/                                 # Legacy dashboard (if exists)
    └── ...
```

## Dashboard Types

### Workplace Dashboard (Default)

**Purpose**: Main entry dashboard showing actionable insights

**File**: `workplace/workplace.component.ts`

**Features**:
- **Quick Stats Cards** - Key metrics at a glance
- **Recent Activity** - Latest actions across blueprints
- **Active Tasks** - User's assigned tasks
- **Blueprint List** - Quick access to active projects
- **Shortcuts** - Frequently used actions
- **Calendar Widget** - Upcoming events and deadlines

**Layout**:
```html
<div class="workplace-dashboard">
  <!-- Header -->
  <app-page-header
    title="Workplace"
    subtitle="Welcome back, {{ userName() }}">
    <button nz-button nzType="primary" (click)="createBlueprint()">
      <span nz-icon nzType="plus"></span>
      New Blueprint
    </button>
  </app-page-header>
  
  <!-- Stats Row -->
  <nz-row [nzGutter]="16">
    <nz-col [nzSpan]="6">
      <nz-card>
        <nz-statistic
          nzTitle="Total Blueprints"
          [nzValue]="blueprintCount()"
          [nzPrefix]="projectIcon" />
      </nz-card>
    </nz-col>
    <nz-col [nzSpan]="6">
      <nz-card>
        <nz-statistic
          nzTitle="Active Tasks"
          [nzValue]="taskCount()"
          [nzPrefix]="taskIcon" />
      </nz-card>
    </nz-col>
    <nz-col [nzSpan]="6">
      <nz-card>
        <nz-statistic
          nzTitle="Quality Issues"
          [nzValue]="issueCount()"
          [nzPrefix]="issueIcon"
          [nzValueStyle]="{ color: '#cf1322' }" />
      </nz-card>
    </nz-col>
    <nz-col [nzSpan]="6">
      <nz-card>
        <nz-statistic
          nzTitle="Completion Rate"
          [nzValue]="completionRate()"
          nzSuffix="%"
          [nzPrefix]="chartIcon" />
      </nz-card>
    </nz-col>
  </nz-row>
  
  <!-- Content Grid -->
  <nz-row [nzGutter]="16" class="mt-16">
    <!-- Recent Activity -->
    <nz-col [nzSpan]="16">
      <nz-card nzTitle="Recent Activity">
        <nz-timeline>
          @for (activity of recentActivity(); track activity.id) {
            <nz-timeline-item [nzColor]="activity.color">
              <p>{{ activity.description }}</p>
              <span class="timestamp">{{ activity.timestamp | timeAgo }}</span>
            </nz-timeline-item>
          }
        </nz-timeline>
      </nz-card>
    </nz-col>
    
    <!-- Quick Actions -->
    <nz-col [nzSpan]="8">
      <nz-card nzTitle="Quick Actions">
        <div class="quick-actions">
          <button nz-button nzBlock (click)="createTask()">
            <span nz-icon nzType="plus"></span>
            New Task
          </button>
          <button nz-button nzBlock (click)="createDiary()">
            <span nz-icon nzType="file-text"></span>
            New Diary Entry
          </button>
          <button nz-button nzBlock (click)="createInspection()">
            <span nz-icon nzType="safety"></span>
            New Inspection
          </button>
        </div>
      </nz-card>
    </nz-col>
  </nz-row>
  
  <!-- My Blueprints -->
  <nz-row [nzGutter]="16" class="mt-16">
    <nz-col [nzSpan]="24">
      <nz-card nzTitle="My Blueprints">
        <st
          [data]="myBlueprints()"
          [columns]="blueprintColumns"
          [loading]="loading()"
          (change)="handleTableChange($event)" />
      </nz-card>
    </nz-col>
  </nz-row>
</div>
```

**Implementation**:
```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';
import { STColumn } from '@delon/abc/st';
import { BlueprintService } from '@shared/services/blueprint/blueprint.service';
import { FirebaseAuthService } from '@core/services/firebase-auth.service';

@Component({
  selector: 'app-workplace',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './workplace.component.html',
  styleUrl: './workplace.component.scss'
})
export class WorkplaceComponent {
  private blueprintService = inject(BlueprintService);
  private authService = inject(FirebaseAuthService);
  private router = inject(Router);
  
  // State
  loading = signal(false);
  myBlueprints = signal<Blueprint[]>([]);
  recentActivity = signal<Activity[]>([]);
  
  // Computed metrics
  userName = computed(() => {
    return this.authService.currentUser?.displayName || 'User';
  });
  
  blueprintCount = computed(() => this.myBlueprints().length);
  
  taskCount = computed(() => {
    // Calculate from blueprints
    return this.myBlueprints()
      .reduce((sum, bp) => sum + (bp.task_count || 0), 0);
  });
  
  issueCount = computed(() => {
    // Calculate quality issues
    return this.myBlueprints()
      .reduce((sum, bp) => sum + (bp.issue_count || 0), 0);
  });
  
  completionRate = computed(() => {
    const total = this.taskCount();
    const completed = this.myBlueprints()
      .reduce((sum, bp) => sum + (bp.completed_task_count || 0), 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });
  
  // Table columns
  blueprintColumns: STColumn[] = [
    {
      title: 'Name',
      index: 'name',
      click: (item) => this.viewBlueprint(item)
    },
    {
      title: 'Status',
      index: 'status',
      type: 'badge',
      badge: {
        active: { text: 'Active', color: 'success' },
        draft: { text: 'Draft', color: 'default' },
        archived: { text: 'Archived', color: 'warning' }
      }
    },
    {
      title: 'Progress',
      render: 'progressTemplate'
    },
    {
      title: 'Last Updated',
      index: 'updated_at',
      type: 'date'
    },
    {
      title: 'Actions',
      buttons: [
        {
          text: 'View',
          click: (item) => this.viewBlueprint(item)
        },
        {
          text: 'Tasks',
          click: (item) => this.viewTasks(item)
        }
      ]
    }
  ];
  
  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  async loadDashboardData(): Promise<void> {
    this.loading.set(true);
    
    try {
      const [blueprints, activity] = await Promise.all([
        this.blueprintService.list(),
        this.loadRecentActivity()
      ]);
      
      this.myBlueprints.set(blueprints);
      this.recentActivity.set(activity);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      this.loading.set(false);
    }
  }
  
  async loadRecentActivity(): Promise<Activity[]> {
    // Load recent activity from Firestore
    return [];
  }
  
  createBlueprint(): void {
    this.router.navigate(['/blueprint', 'new']);
  }
  
  createTask(): void {
    // Navigate to task creation
  }
  
  createDiary(): void {
    // Navigate to diary entry
  }
  
  createInspection(): void {
    // Navigate to quality inspection
  }
  
  viewBlueprint(blueprint: Blueprint): void {
    this.router.navigate(['/blueprint', blueprint.id]);
  }
  
  viewTasks(blueprint: Blueprint): void {
    this.router.navigate(['/blueprint', blueprint.id, 'tasks']);
  }
  
  handleTableChange(event: any): void {
    // Handle ST table events (pagination, sorting, filtering)
  }
}
```

### Analysis Dashboard

**Purpose**: Data visualization and reporting for insights

**File**: `analysis/analysis.component.ts`

**Features**:
- **Time-series Charts** - Task completion over time
- **Progress Charts** - Blueprint progress visualization
- **Quality Trends** - Issue tracking and trends
- **Resource Utilization** - Team member workload
- **Export Reports** - PDF/Excel export functionality

**Charts**:
```typescript
import { Component, signal, computed } from '@angular/core';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="analysis-dashboard">
      <app-page-header title="Analysis" subtitle="Data insights and reports" />
      
      <!-- Date Range Selector -->
      <nz-card>
        <nz-range-picker
          [(ngModel)]="dateRange"
          (ngModelChange)="onDateRangeChange()" />
      </nz-card>
      
      <!-- Charts Grid -->
      <nz-row [nzGutter]="16" class="mt-16">
        <!-- Task Completion Chart -->
        <nz-col [nzSpan]="12">
          <nz-card nzTitle="Task Completion Trend">
            <div echarts [options]="taskChartOptions()" style="height: 400px;"></div>
          </nz-card>
        </nz-col>
        
        <!-- Quality Issues Chart -->
        <nz-col [nzSpan]="12">
          <nz-card nzTitle="Quality Issues">
            <div echarts [options]="qualityChartOptions()" style="height: 400px;"></div>
          </nz-card>
        </nz-col>
      </nz-row>
      
      <!-- Progress Chart -->
      <nz-row [nzGutter]="16" class="mt-16">
        <nz-col [nzSpan]="24">
          <nz-card nzTitle="Blueprint Progress">
            <div echarts [options]="progressChartOptions()" style="height: 400px;"></div>
          </nz-card>
        </nz-col>
      </nz-row>
    </div>
  `
})
export class AnalysisComponent {
  dateRange = signal<[Date, Date] | null>(null);
  
  taskChartOptions = computed((): EChartsOption => ({
    title: { text: 'Task Completion' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: { type: 'value' },
    series: [{
      data: [5, 8, 12, 15, 10, 7, 9],
      type: 'line',
      smooth: true
    }]
  }));
  
  qualityChartOptions = computed((): EChartsOption => ({
    title: { text: 'Quality Issues by Type' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: [
        { value: 12, name: 'Safety' },
        { value: 8, name: 'Structural' },
        { value: 5, name: 'Material' },
        { value: 3, name: 'Other' }
      ]
    }]
  }));
  
  progressChartOptions = computed((): EChartsOption => ({
    title: { text: 'Blueprint Progress' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['Blueprint A', 'Blueprint B', 'Blueprint C', 'Blueprint D']
    },
    yAxis: { type: 'value', max: 100 },
    series: [{
      data: [75, 60, 90, 45],
      type: 'bar',
      itemStyle: { color: '#52c41a' }
    }]
  }));
  
  onDateRangeChange(): void {
    // Reload data for new date range
  }
}
```

### Monitor Dashboard

**Purpose**: Real-time system health monitoring

**File**: `monitor/monitor.component.ts`

**Features**:
- **System Health** - API uptime and response times
- **Database Performance** - Firestore query metrics
- **User Activity** - Active users and sessions
- **Error Tracking** - Recent errors and warnings
- **Auto-refresh** - Updates every 30 seconds

**Implementation**:
```typescript
@Component({
  selector: 'app-monitor',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="monitor-dashboard">
      <app-page-header title="Monitor" subtitle="System health and performance">
        <button nz-button (click)="refresh()">
          <span nz-icon nzType="reload"></span>
          Refresh
        </button>
      </app-page-header>
      
      <!-- Health Status -->
      <nz-alert
        [nzType]="healthStatus().type"
        [nzMessage]="healthStatus().message"
        [nzDescription]="healthStatus().description"
        nzShowIcon />
      
      <!-- Metrics Grid -->
      <nz-row [nzGutter]="16" class="mt-16">
        <nz-col [nzSpan]="8">
          <app-cpu-usage />
        </nz-col>
        <nz-col [nzSpan]="8">
          <app-memory-usage />
        </nz-col>
        <nz-col [nzSpan]="8">
          <app-api-health />
        </nz-col>
      </nz-row>
      
      <!-- Recent Errors -->
      <nz-row [nzGutter]="16" class="mt-16">
        <nz-col [nzSpan]="24">
          <nz-card nzTitle="Recent Errors">
            <nz-list
              [nzDataSource]="recentErrors()"
              [nzRenderItem]="errorTemplate">
            </nz-list>
          </nz-card>
        </nz-col>
      </nz-row>
    </div>
  `
})
export class MonitorComponent {
  healthStatus = signal({
    type: 'success' as 'success' | 'warning' | 'error',
    message: 'All Systems Operational',
    description: 'All services running normally'
  });
  
  recentErrors = signal<Error[]>([]);
  
  constructor() {
    // Auto-refresh every 30 seconds
    effect(() => {
      const interval = setInterval(() => this.refresh(), 30000);
      return () => clearInterval(interval);
    });
  }
  
  async refresh(): Promise<void> {
    // Reload monitoring data
  }
}
```

## Context Switching

### Context Dashboard Component

**Purpose**: Switch between user/organization/blueprint contexts

**File**: `context-dashboard.component.ts`

```typescript
@Component({
  selector: 'app-context-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="context-switcher">
      <nz-segmented
        [nzOptions]="contextOptions"
        [(ngModel)]="activeContext"
        (ngModelChange)="onContextChange()" />
      
      @switch (activeContext) {
        @case ('user') {
          <app-workplace />
        }
        @case ('organization') {
          <app-organization-dashboard />
        }
        @case ('blueprint') {
          <app-blueprint-dashboard />
        }
      }
    </div>
  `
})
export class ContextDashboardComponent {
  activeContext = signal<'user' | 'organization' | 'blueprint'>('user');
  
  contextOptions = [
    { label: 'My Work', value: 'user' },
    { label: 'Organization', value: 'organization' },
    { label: 'Blueprint', value: 'blueprint' }
  ];
  
  onContextChange(): void {
    // Save preference and reload data
  }
}
```

## Routing Configuration

```typescript
// routes.ts
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'workplace',
    pathMatch: 'full'
  },
  {
    path: 'workplace',
    component: WorkplaceComponent,
    data: { title: 'Workplace' }
  },
  {
    path: 'analysis',
    component: AnalysisComponent,
    data: { title: 'Analysis' }
  },
  {
    path: 'monitor',
    component: MonitorComponent,
    canActivate: [adminGuard],  // Admin only
    data: { title: 'Monitor' }
  }
];
```

## Best Practices

1. **Performance**
   - Use `computed()` for derived metrics
   - Implement virtual scrolling for large lists
   - Lazy load charts on viewport visibility
   - Cache API responses with TTL

2. **User Experience**
   - Show loading states during data fetch
   - Provide empty states with helpful actions
   - Use optimistic UI updates
   - Auto-refresh with user control

3. **Data Visualization**
   - Choose appropriate chart types
   - Use consistent color schemes
   - Provide interactive tooltips
   - Support export to PDF/Excel

4. **Accessibility**
   - Provide text alternatives for charts
   - Use semantic HTML
   - Support keyboard navigation
   - Test with screen readers

## Testing

```typescript
describe('WorkplaceComponent', () => {
  it('should calculate metrics correctly', () => {
    const component = TestBed.createComponent(WorkplaceComponent).componentInstance;
    component.myBlueprints.set(mockBlueprints);
    
    expect(component.blueprintCount()).toBe(3);
    expect(component.taskCount()).toBeGreaterThan(0);
  });
});
```

## Related Documentation

- **[App Module](../../AGENTS.md)** - Application structure
- **[Routes](../AGENTS.md)** - Routing overview
- **[Blueprint Module](../blueprint/AGENTS.md)** - Blueprint integration

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development
