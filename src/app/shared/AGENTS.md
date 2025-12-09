# Shared 共享層 AGENTS.md

本檔案涵蓋 `src/app/shared/` 目錄下的可重用元件、管線、指令與工具函式。

## 目錄結構

```
src/app/shared/
├── components/              # 可重用 UI 元件
│   ├── page-header/         # 頁面標頭與麵包屑
│   ├── result/              # 成功/錯誤結果頁
│   └── exception/           # 錯誤顯示元件
├── pipes/                   # 自訂管線
│   ├── safe.pipe.ts         # 安全 HTML/URL
│   ├── time-ago.pipe.ts     # 相對時間
│   └── file-size.pipe.ts    # 檔案大小格式化
├── directives/              # 自訂指令
│   ├── permission.directive.ts   # 權限控制顯示
│   └── auto-focus.directive.ts   # 自動聚焦
├── utils/                   # 工具函式
└── index.ts                 # SHARED_IMPORTS 匯出
```

## SHARED_IMPORTS

**用途**: 集中匯入常用模組，避免重複

**位置**: `src/app/shared/index.ts`

```typescript
export const SHARED_IMPORTS = [
  // Angular 核心
  CommonModule,
  ReactiveFormsModule,
  FormsModule,
  RouterModule,
  
  // ng-zorro-antd (常用元件)
  NzButtonModule,
  NzIconModule,
  NzCardModule,
  NzFormModule,
  NzInputModule,
  NzTableModule,
  NzModalModule,
  NzMessageModule,
  NzSpinModule,
  // ... 其他常用模組
  
  // @delon 元件
  STModule,
  SEModule,
  
  // 共享元件
  PageHeaderComponent,
  ResultComponent,
  
  // 共享管線
  SafePipe,
  TimeAgoPipe,
  FileSizePipe,
  
  // 共享指令
  PermissionDirective,
  AutoFocusDirective
];
```

## 開發環境提示

### 新增共享元件

```bash
ng generate component shared/components/[component-name] --standalone

# 記得加入 SHARED_IMPORTS
```

### 新增管線

```bash
ng generate pipe shared/pipes/[pipe-name] --standalone
```

### 新增指令

```bash
ng generate directive shared/directives/[directive-name] --standalone
```

## 程式碼模式

### 共享元件範本

```typescript
import { Component, input, output, computed } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-custom-component',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="custom-component">
      @if (loading()) {
        <nz-spin />
      } @else {
        <nz-card [nzTitle]="title()">
          <ng-content />
        </nz-card>
      }
    </div>
  `
})
export class CustomComponent {
  // 使用 input() 函式
  title = input.required<string>();
  loading = input<boolean>(false);
  
  // 使用 output() 函式
  action = output<void>();
  
  // 計算屬性
  displayTitle = computed(() => this.title().toUpperCase());
  
  onAction(): void {
    this.action.emit();
  }
}
```

### 自訂管線範本

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customFormat',
  standalone: true
})
export class CustomFormatPipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    // 轉換邏輯
    return value;
  }
}

// 使用
// {{ data | customFormat:arg1:arg2 }}
```

### 自訂指令範本

```typescript
import { Directive, input, inject, OnInit } from '@angular/core';
import { ElementRef } from '@angular/core';

@Directive({
  selector: '[appCustom]',
  standalone: true
})
export class CustomDirective implements OnInit {
  customValue = input<string>('', { alias: 'appCustom' });
  
  private el = inject(ElementRef);
  
  ngOnInit(): void {
    const value = this.customValue();
    // 實作邏輯
  }
}

// 使用
// <div [appCustom]="value"></div>
```

### 工具函式範本

```typescript
// src/app/shared/utils/string.utils.ts
export class StringUtils {
  static truncate(str: string, length: number, suffix: string = '...'): string {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }
  
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  static isEmail(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }
}

// 使用
// import { StringUtils } from '@shared/utils/string.utils';
// const slug = StringUtils.slugify('Hello World'); // "hello-world"
```

## 常用元件

### PageHeaderComponent

```typescript
<app-page-header
  title="頁面標題"
  subtitle="副標題"
  [showBack]="true"
  [breadcrumbs]="[
    { label: '首頁', path: '/' },
    { label: 'Blueprints', path: '/blueprint' },
    { label: '詳情' }
  ]">
  <button nz-button nzType="primary">動作按鈕</button>
</app-page-header>
```

### ResultComponent

```typescript
<app-result
  status="success"
  title="操作成功"
  subtitle="您的變更已儲存"
  [showRetry]="false">
  <div actions>
    <button nz-button nzType="primary" [routerLink]="['/']">
      返回首頁
    </button>
  </div>
</app-result>
```

## 常用管線

### SafePipe (HTML 清理)

```html
<div [innerHTML]="htmlContent | safe:'html'"></div>
```

### TimeAgoPipe (相對時間)

```html
<span>{{ createdAt | timeAgo }}</span>
<!-- 輸出: "2 hours ago" -->
```

### FileSizePipe (檔案大小)

```html
<span>{{ fileSize | fileSize }}</span>
<!-- 輸出: "2.5 MB" -->
```

## 常用指令

### PermissionDirective (權限控制)

```html
<!-- 有權限時才顯示 -->
<button 
  *appPermission="'edit'; blueprintId: blueprintId"
  nz-button 
  (click)="edit()">
  編輯
</button>
```

### AutoFocusDirective (自動聚焦)

```html
<!-- 載入時自動聚焦 -->
<input nz-input appAutoFocus />

<!-- 延遲聚焦 -->
<input nz-input [appAutoFocus]="300" />
```

## 測試指引

### 元件測試

```typescript
import { TestBed } from '@angular/core/testing';
import { CustomComponent } from './custom.component';

describe('CustomComponent', () => {
  it('should create', () => {
    const fixture = TestBed.createComponent(CustomComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Title');
    expect(component).toBeTruthy();
  });
});
```

### 管線測試

```typescript
import { CustomFormatPipe } from './custom-format.pipe';

describe('CustomFormatPipe', () => {
  let pipe: CustomFormatPipe;
  
  beforeEach(() => {
    pipe = new CustomFormatPipe();
  });
  
  it('should transform value', () => {
    expect(pipe.transform('test')).toBe('expected');
  });
});
```

## 常見問題

### Q: 何時建立共享元件?

**A**: 當元件被 3 個以上模組使用時，考慮移到 shared

### Q: 如何避免 SHARED_IMPORTS 過大?

**A**: 
- 只匯入真正常用的模組
- 特定模組專用的元件不要放入 SHARED_IMPORTS
- 定期檢視並移除未使用的匯入

### Q: 工具函式要測試嗎?

**A**: 是的，工具函式應該有完整的單元測試，因為它們被廣泛使用

## PR 提交檢查清單

- [ ] 元件為 Standalone
- [ ] 已加入 SHARED_IMPORTS (如適用)
- [ ] 使用 `input()` 和 `output()` 函式
- [ ] Pure pipes (無副作用)
- [ ] 工具函式為 pure functions
- [ ] 測試通過
- [ ] Lint 通過
- [ ] JSDoc 註解完整

## 相關文檔

- **專案根目錄**: `../../AGENTS.md`
- **應用層**: `../AGENTS.md`
- **核心服務**: `../core/AGENTS.md`

---

**版本**: 2.0.0 (簡化版)  
**最後更新**: 2025-12-09
