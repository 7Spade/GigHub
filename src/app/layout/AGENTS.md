# Layout 佈局層 AGENTS.md

本檔案涵蓋 `src/app/layout/` 目錄下的佈局元件開發指引。

## 目錄結構

```
src/app/layout/
├── basic/              # 基礎佈局 (已登入使用者)
│   ├── basic.component.ts
│   ├── widgets/        # 佈局小工具 (側邊欄、頂欄等)
│   └── ...
├── blank/              # 空白佈局 (最小化)
└── passport/           # 認證佈局 (登入、註冊頁面)
```

## 佈局元件說明

### Basic Layout (基礎佈局)

**用途**: 已登入使用者的主要佈局，包含側邊欄、頂欄、麵包屑等。

**特點**:
- ng-alain 的 `LayoutBasicComponent`
- 響應式側邊欄 (可摺疊)
- 全域頂欄 (使用者資訊、通知、設定)
- 麵包屑導航
- 內容區域 (`<router-outlet>`)

**使用範圍**: Dashboard、Blueprint、所有業務模組

### Passport Layout (認證佈局)

**用途**: 認證相關頁面 (登入、註冊、忘記密碼)

**特點**:
- 置中表單設計
- 品牌 Logo 與標語
- 簡潔無干擾介面
- 響應式設計

**使用範圍**: `/passport/login`, `/passport/register`, `/passport/lock`

### Blank Layout (空白佈局)

**用途**: 最小化佈局，無側邊欄與頂欄

**特點**:
- 僅有 `<router-outlet>`
- 無導航元件
- 適合全螢幕頁面

**使用範圍**: 列印頁面、全螢幕展示、特殊功能頁

## 開發環境提示

### 修改側邊欄選單

側邊欄選單定義在 `src/app/layout/basic/widgets/sidebar/sidebar.component.ts`:

```typescript
// 選單項目定義
menu = [
  {
    text: 'Dashboard',
    icon: 'dashboard',
    link: '/dashboard'
  },
  {
    text: 'Blueprints',
    icon: 'project',
    link: '/blueprint',
    children: [
      { text: 'List', link: '/blueprint' },
      { text: 'Create', link: '/blueprint/create' }
    ]
  }
];
```

### 修改頂欄

頂欄元件位於 `src/app/layout/basic/widgets/header/header.component.ts`:

```typescript
// 右側選單項目
rightMenu = [
  {
    icon: 'bell',
    badge: notificationCount(),
    click: () => this.showNotifications()
  },
  {
    icon: 'setting',
    click: () => this.router.navigate(['/settings'])
  }
];
```

### 新增佈局小工具

```bash
# 建立新小工具
ng generate component layout/basic/widgets/[widget-name] --standalone

# 範例: 新增搜尋欄小工具
ng generate component layout/basic/widgets/search-bar --standalone
```

## 程式碼模式

### 佈局元件範本

```typescript
import { Component, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'layout-custom',
  standalone: true,
  imports: [SHARED_IMPORTS, RouterOutlet],
  template: `
    <nz-layout class="layout-custom">
      <!-- 頂欄 -->
      <nz-header>
        <app-header />
      </nz-header>
      
      <!-- 主內容 -->
      <nz-layout>
        <!-- 側邊欄 (可選) -->
        @if (showSidebar()) {
          <nz-sider [nzCollapsed]="collapsed()">
            <app-sidebar />
          </nz-sider>
        }
        
        <!-- 內容區 -->
        <nz-layout>
          <!-- 麵包屑 (可選) -->
          @if (showBreadcrumb()) {
            <nz-breadcrumb>
              <nz-breadcrumb-item>Home</nz-breadcrumb-item>
            </nz-breadcrumb>
          }
          
          <!-- 路由出口 -->
          <nz-content>
            <router-outlet />
          </nz-content>
          
          <!-- 頁尾 (可選) -->
          <nz-footer>
            © 2025 GigHub. All Rights Reserved.
          </nz-footer>
        </nz-layout>
      </nz-layout>
    </nz-layout>
  `,
  styles: [`
    .layout-custom {
      min-height: 100vh;
    }
  `]
})
export class CustomLayoutComponent {
  collapsed = signal(false);
  showSidebar = signal(true);
  showBreadcrumb = signal(true);
  
  toggleSidebar(): void {
    this.collapsed.update(v => !v);
  }
}
```

### 側邊欄小工具範本

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';

interface MenuItem {
  text: string;
  icon: string;
  link: string;
  badge?: number;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <ul nz-menu nzMode="inline" [nzInlineCollapsed]="collapsed()">
      @for (item of menuItems(); track item.link) {
        @if (item.children) {
          <li nz-submenu [nzTitle]="item.text" [nzIcon]="item.icon">
            <ul>
              @for (child of item.children; track child.link) {
                <li nz-menu-item [nzSelected]="isActive(child.link)">
                  <a [routerLink]="child.link">{{ child.text }}</a>
                </li>
              }
            </ul>
          </li>
        } @else {
          <li nz-menu-item [nzSelected]="isActive(item.link)">
            <span nz-icon [nzType]="item.icon"></span>
            <span>{{ item.text }}</span>
            @if (item.badge) {
              <nz-badge [nzCount]="item.badge" />
            }
          </li>
        }
      }
    </ul>
  `
})
export class SidebarComponent {
  private router = inject(Router);
  
  collapsed = signal(false);
  
  menuItems = signal<MenuItem[]>([
    {
      text: 'Dashboard',
      icon: 'dashboard',
      link: '/dashboard'
    },
    {
      text: 'Blueprints',
      icon: 'project',
      link: '/blueprint',
      badge: 3,
      children: [
        { text: 'All Blueprints', icon: 'list', link: '/blueprint' },
        { text: 'My Blueprints', icon: 'user', link: '/blueprint/my' },
        { text: 'Create New', icon: 'plus', link: '/blueprint/create' }
      ]
    }
  ]);
  
  isActive(link: string): boolean {
    return this.router.url === link;
  }
}
```

### 頂欄小工具範本

```typescript
import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '@shared';
import { FirebaseAuthService } from '@core/services/firebase-auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-space class="header-content">
      <!-- Logo -->
      <div *nzSpaceItem class="logo">
        <span>GigHub</span>
      </div>
      
      <!-- 搜尋欄 (可選) -->
      <div *nzSpaceItem class="search-box">
        <nz-input-group [nzPrefix]="searchIcon">
          <input nz-input placeholder="Search..." />
        </nz-input-group>
        <ng-template #searchIcon>
          <span nz-icon nzType="search"></span>
        </ng-template>
      </div>
      
      <!-- 右側選單 -->
      <div *nzSpaceItem class="right-menu">
        <!-- 通知 -->
        <button nz-button nzType="text" nz-dropdown [nzDropdownMenu]="notificationMenu">
          <span nz-icon nzType="bell"></span>
          @if (notificationCount() > 0) {
            <nz-badge [nzCount]="notificationCount()" />
          }
        </button>
        
        <!-- 使用者選單 -->
        <button nz-button nzType="text" nz-dropdown [nzDropdownMenu]="userMenu">
          <nz-avatar [nzSrc]="userAvatar()" />
          <span>{{ userName() }}</span>
        </button>
      </div>
    </nz-space>
    
    <!-- 通知下拉選單 -->
    <nz-dropdown-menu #notificationMenu="nzDropdownMenu">
      <ul nz-menu>
        <li nz-menu-item>Notification 1</li>
        <li nz-menu-item>Notification 2</li>
      </ul>
    </nz-dropdown-menu>
    
    <!-- 使用者下拉選單 -->
    <nz-dropdown-menu #userMenu="nzDropdownMenu">
      <ul nz-menu>
        <li nz-menu-item (click)="goToProfile()">
          <span nz-icon nzType="user"></span>
          Profile
        </li>
        <li nz-menu-item (click)="goToSettings()">
          <span nz-icon nzType="setting"></span>
          Settings
        </li>
        <li nz-menu-divider></li>
        <li nz-menu-item (click)="logout()">
          <span nz-icon nzType="logout"></span>
          Logout
        </li>
      </ul>
    </nz-dropdown-menu>
  `
})
export class HeaderComponent {
  private router = inject(Router);
  private auth = inject(FirebaseAuthService);
  
  userName = signal('John Doe');
  userAvatar = signal('/assets/avatar.png');
  notificationCount = signal(5);
  
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
  
  goToSettings(): void {
    this.router.navigate(['/settings']);
  }
  
  async logout(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/passport/login']);
  }
}
```

## 測試指引

### 佈局元件測試

```typescript
import { TestBed } from '@angular/core/testing';
import { BasicLayoutComponent } from './basic.component';
import { provideRouter } from '@angular/router';

describe('BasicLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicLayoutComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });
  
  it('should create', () => {
    const fixture = TestBed.createComponent(BasicLayoutComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
  
  it('should toggle sidebar', () => {
    const fixture = TestBed.createComponent(BasicLayoutComponent);
    const component = fixture.componentInstance;
    
    const initialState = component.collapsed();
    component.toggleSidebar();
    
    expect(component.collapsed()).toBe(!initialState);
  });
});
```

## 常見問題

### Q: 如何為不同模組使用不同佈局?

**A**: 在路由配置中指定 component:
```typescript
// src/app/routes/routes.ts
export const routes: Routes = [
  {
    path: '',
    component: BasicLayoutComponent,  // 使用基礎佈局
    children: [
      { path: 'dashboard', loadChildren: ... }
    ]
  },
  {
    path: 'passport',
    component: PassportLayoutComponent,  // 使用認證佈局
    children: [
      { path: 'login', loadChildren: ... }
    ]
  }
];
```

### Q: 如何根據權限隱藏選單項目?

**A**: 使用 computed signal 結合權限服務:
```typescript
menuItems = computed(() => {
  const items: MenuItem[] = [
    { text: 'Dashboard', link: '/dashboard' }
  ];
  
  if (this.permissionService.hasRole('admin')) {
    items.push({ text: 'Admin', link: '/admin' });
  }
  
  return items;
});
```

### Q: 如何響應視窗大小變化?

**A**: 使用 ResizeObserver 或 BreakpointObserver:
```typescript
import { BreakpointObserver } from '@angular/cdk/layout';

private breakpoint = inject(BreakpointObserver);

constructor() {
  this.breakpoint.observe(['(max-width: 768px)'])
    .pipe(takeUntilDestroyed())
    .subscribe(result => {
      this.isMobile.set(result.matches);
    });
}
```

## PR 提交檢查清單

- [ ] 佈局為 Standalone Component
- [ ] 使用 `signal()` 管理狀態
- [ ] 響應式設計 (手機、平板、桌面)
- [ ] 無障礙標籤 (ARIA)
- [ ] 測試通過
- [ ] Lint 通過
- [ ] 佈局元件可重用

## 相關文檔

- **專案根目錄**: `../../AGENTS.md`
- **應用層**: `../AGENTS.md`
- **共享元件**: `../shared/AGENTS.md`
- **核心服務**: `../core/AGENTS.md`

---

**版本**: 1.0.0  
**最後更新**: 2025-12-09
