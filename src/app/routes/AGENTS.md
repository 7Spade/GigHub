# Routes 路由層 AGENTS.md

本檔案涵蓋 `src/app/routes/` 目錄下的功能模組路由開發指引。

## 目錄結構

```
src/app/routes/
├── routes.ts                   # 主路由配置
├── blueprint/                  # Blueprint 模組 (查看 blueprint/AGENTS.md)
├── dashboard/                  # Dashboard 模組
├── passport/                   # 認證模組
└── exception/                  # 錯誤頁面
```

## 開發環境提示

### 新增路由模組

```bash
# 1. 建立目錄與元件
mkdir -p src/app/routes/[module-name]
ng generate component routes/[module-name]/[module-name]-list --standalone
ng generate component routes/[module-name]/[module-name]-detail --standalone

# 2. 建立路由檔案
touch src/app/routes/[module-name]/routes.ts

# 3. 建立模組 AGENTS.md
touch src/app/routes/[module-name]/AGENTS.md

# 4. 註冊到主路由 (src/app/routes/routes.ts)
{
  path: '[module-name]',
  loadChildren: () => import('./[module-name]/routes').then(m => m.routes)
}
```

### 路由配置範本

```typescript
// src/app/routes/[module-name]/routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
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
    canActivate: [authGuard, permissionGuard('read')],
    data: { title: 'Module Detail' }
  },
  {
    path: ':id/edit',
    component: ModuleEditComponent,
    canActivate: [authGuard, permissionGuard('edit')],
    data: { title: 'Edit Module' }
  }
];
```

## 路由守衛 (Guards)

### 常用守衛

- **`authGuard`**: 驗證使用者已登入
- **`permissionGuard(action)`**: 檢查使用者權限
- **`moduleEnabledGuard(moduleId)`**: 檢查模組是否啟用

### 使用範例

```typescript
// 單一守衛
{
  path: 'dashboard',
  canActivate: [authGuard],
  component: DashboardComponent
}

// 多重守衛組合
{
  path: 'blueprint/:id/edit',
  canActivate: [
    authGuard,                        // 必須登入
    permissionGuard('edit'),          // 必須有編輯權限
    moduleEnabledGuard('blueprint')   // 模組必須啟用
  ],
  component: BlueprintEditComponent
}
```

## 導航模式

### 程式化導航

```typescript
import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({...})
export class MyComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  // 絕對路徑導航
  goToBlueprint(id: string): void {
    this.router.navigate(['/blueprint', id]);
  }
  
  // 相對路徑導航
  goToEdit(): void {
    this.router.navigate(['edit'], { relativeTo: this.route });
  }
  
  // 帶查詢參數
  goToList(): void {
    this.router.navigate(['/blueprint'], {
      queryParams: { status: 'active', owner: 'me' }
    });
  }
  
  // 返回上一頁
  goBack(): void {
    window.history.back();
    // 或
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
```

### 讀取路由參數

```typescript
// 快照讀取 (單次)
const id = this.route.snapshot.paramMap.get('id');
const status = this.route.snapshot.queryParamMap.get('status');

// Observable 讀取 (響應式)
this.route.paramMap
  .pipe(takeUntilDestroyed())
  .subscribe(params => {
    const id = params.get('id');
    if (id) this.loadData(id);
  });
```

## 測試指引

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from './routes';

describe('Routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)]
    });
  });
  
  it('should navigate to dashboard', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/dashboard']);
    expect(router.url).toBe('/dashboard');
  });
});
```

## 常見問題

### Q: 如何防止未保存數據丟失?

**A**: 使用 `canDeactivate` 守衛
```typescript
export const unsavedChangesGuard: CanDeactivateFn<ComponentWithForm> = (component) => {
  if (component.hasUnsavedChanges()) {
    return confirm('您有未保存的變更，確定要離開嗎？');
  }
  return true;
};

// 使用
{
  path: 'edit',
  canDeactivate: [unsavedChangesGuard],
  component: EditComponent
}
```

### Q: 如何處理404錯誤?

**A**: 使用萬用路由
```typescript
{
  path: '**',
  redirectTo: '/exception/404'
}
```

### Q: 如何實作麵包屑?

**A**: 使用路由 `data` 與 computed signal
```typescript
breadcrumbs = computed(() => {
  const route = this.router.getCurrentNavigation();
  // 解析路由樹建立麵包屑
  return [...];
});
```

## PR 提交檢查清單

- [ ] 路由使用延遲載入 (lazy loading)
- [ ] 守衛配置正確
- [ ] 路由參數型別安全
- [ ] `data` 欄位提供足夠資訊
- [ ] 測試路由導航
- [ ] 測試守衛邏輯
- [ ] 更新模組 AGENTS.md

## 相關文檔

- **專案根目錄**: `../../AGENTS.md`
- **應用層**: `../AGENTS.md`
- **Blueprint 模組**: `./blueprint/AGENTS.md`
- **核心守衛**: `../core/AGENTS.md`

---

**版本**: 2.0.0 (簡化版)  
**最後更新**: 2025-12-09
