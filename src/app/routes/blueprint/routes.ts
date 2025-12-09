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
