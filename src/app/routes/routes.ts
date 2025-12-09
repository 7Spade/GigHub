import { Routes } from '@angular/router';
import { startPageGuard } from '@core';
import { authSimpleCanActivate, authSimpleCanActivateChild } from '@delon/auth';

import { LayoutBasicComponent } from '../layout';

export const routes: Routes = [
  {
    path: '',
    component: LayoutBasicComponent,
    canActivate: [startPageGuard, authSimpleCanActivate],
    canActivateChild: [authSimpleCanActivateChild],
    data: {},
    children: [
      { path: '', redirectTo: 'dashboard/user', pathMatch: 'full' },
      {
        path: 'user',
        loadChildren: () => import('./user/routes').then(m => m.routes),
        data: { title: '個人設定' }
      },
      {
        path: 'organization',
        loadChildren: () => import('./organization/routes').then(m => m.routes),
        data: { title: '組織管理' }
      },
      {
        path: 'team',
        loadChildren: () => import('./team/routes').then(m => m.routes),
        data: { title: '團隊管理' }
      },
      // Blueprint module - lazy loaded feature module
      {
        path: 'blueprints/user',
        loadChildren: () => import('./blueprint/routes').then(m => m.routes),
        data: { title: '我的藍圖' }
      },
      {
        path: 'blueprints/organization',
        loadChildren: () => import('./blueprint/routes').then(m => m.routes),
        data: { title: '組織藍圖' }
      }
    ]
  },
  // passport
  { path: '', loadChildren: () => import('./passport/routes').then(m => m.routes) },
  { path: 'exception', loadChildren: () => import('./exception/routes').then(m => m.routes) },
  { path: '**', redirectTo: 'exception/404' }
];
