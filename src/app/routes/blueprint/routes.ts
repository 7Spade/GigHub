import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./blueprint-list.component').then(m => m.BlueprintListComponent),
    data: { title: '藍圖管理' }
  },
  {
    path: ':id',
    loadComponent: () => import('./blueprint-detail.component').then(m => m.BlueprintDetailComponent),
    data: { title: '藍圖詳情' }
  },
  {
    path: ':id/designer',
    loadComponent: () => import('./blueprint-designer.component').then(m => m.BlueprintDesignerComponent),
    data: { title: '藍圖設計器' }
  },
  {
    path: ':id/container',
    children: [
      {
        path: '',
        loadComponent: () => import('./container/container-dashboard.component').then(m => m.ContainerDashboardComponent),
        data: { title: '容器儀表板' }
      },
      {
        path: 'event-bus',
        loadComponent: () => import('./container/event-bus-monitor.component').then(m => m.EventBusMonitorComponent),
        data: { title: '事件總線監控' }
      }
    ]
  },
  {
    path: ':id/members',
    loadComponent: () => import('./members/blueprint-members.component').then(m => m.BlueprintMembersComponent),
    data: { title: '成員管理' }
  },
  {
    path: ':id/audit',
    loadComponent: () => import('./audit/audit-logs.component').then(m => m.AuditLogsComponent),
    data: { title: '審計日誌' }
  }
];
