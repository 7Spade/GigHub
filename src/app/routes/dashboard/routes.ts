import { Routes } from '@angular/router';
import { ContextType } from '@core';

import { DashboardAnalysisComponent } from './analysis/analysis.component';
import { DashboardMonitorComponent } from './monitor/monitor.component';
import { DashboardV1Component } from './v1/v1.component';
import { DashboardWorkplaceComponent } from './workplace/workplace.component';

export const routes: Routes = [
  { path: '', redirectTo: 'user', pathMatch: 'full' },
  {
    path: 'user',
    loadComponent: () => import('./context-dashboard.component').then(m => m.ContextDashboardComponent),
    data: { context: ContextType.USER, title: '個人儀錶盤' }
  },
  {
    path: 'organization',
    loadComponent: () => import('./context-dashboard.component').then(m => m.ContextDashboardComponent),
    data: { context: ContextType.ORGANIZATION, title: '組織儀錶盤' }
  },
  {
    path: 'team',
    loadComponent: () => import('./context-dashboard.component').then(m => m.ContextDashboardComponent),
    data: { context: ContextType.TEAM, title: '團隊儀錶盤' }
  },
  { path: 'v1', component: DashboardV1Component },
  { path: 'analysis', component: DashboardAnalysisComponent },
  { path: 'monitor', component: DashboardMonitorComponent },
  { path: 'workplace', component: DashboardWorkplaceComponent }
];
