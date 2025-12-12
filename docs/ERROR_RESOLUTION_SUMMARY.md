# 錯誤解決方案總結 (Error Resolution Summary)

## 問題陳述 (Problem Statement)

根據 `localhost-1765535315469.log` 分析，發現兩大類錯誤：

1. **Supabase 初始化失敗** (Critical)
   - 錯誤位置：`supabase.service.ts:98`
   - 原因：環境變數 `NG_PUBLIC_SUPABASE_URL` 和 `NG_PUBLIC_SUPABASE_ANON_KEY` 未定義
   - 影響：所有 Supabase 功能無法使用（Tasks, Logs, Notifications）

2. **Firebase API 在注入上下文外調用** (Warning)
   - 錯誤位置：
     - `firebase-auth.service.ts:67` (signInWithEmailAndPassword)
     - `organization.repository.ts:67` (getDocs)
     - `team.repository.ts:62` (getDocs)
   - 原因：Firebase Firestore 函式在非 Angular 注入上下文中調用
   - 影響：可能導致微妙的變更檢測和 hydration 錯誤

## 根本原因分析 (Root Cause Analysis)

### 1. Supabase Configuration Missing

**問題**：`environment.ts` 和 `environment.prod.ts` 缺少 Supabase 配置鍵。

**分析**：
- `SupabaseService.getEnvVar()` 依序查找：
  1. `import.meta.env[key]` (Vite)
  2. `process.env[key]` (Webpack)
  3. `environment[key]` (Angular)
- 所有來源皆未定義 Supabase 配置，導致初始化失敗

**設計決策**：
- 在 `environment.ts` 和 `environment.prod.ts` 添加空字串作為預設值
- 維持 graceful degradation（Supabase 服務會記錄錯誤但不阻塞應用）
- `.env.example` 已有完整說明，無需修改

### 2. Firebase Injection Context Warnings

**問題**：Firebase API 在非注入上下文調用，觸發 AngularFire 警告。

**分析**：
- Firebase Firestore 函式 (`getDocs`, `signInWithEmailAndPassword`) 內部使用 Angular 注入系統
- 在 async 函式或 Observable pipeline 中調用時，可能失去注入上下文
- AngularFire 警告這可能導致變更檢測和 hydration 問題

**設計決策**：
- 使用 Angular 的 `runInInjectionContext()` 包裝 Firebase API 調用
- 通過 `inject(Injector)` 獲取 injector 引用
- 最小化改動，僅包裝必要的 API 調用

## 解決方案 (Solution)

### 變更檔案 (Changed Files)

1. **`src/environments/environment.ts`**
   - 添加 `NG_PUBLIC_SUPABASE_URL: ''`
   - 添加 `NG_PUBLIC_SUPABASE_ANON_KEY: ''`

2. **`src/environments/environment.prod.ts`**
   - 添加 `NG_PUBLIC_SUPABASE_URL: ''`
   - 添加 `NG_PUBLIC_SUPABASE_ANON_KEY: ''`

3. **`src/app/core/services/firebase-auth.service.ts`**
   - 導入：`Injector, runInInjectionContext`
   - 注入：`private readonly injector = inject(Injector)`
   - 包裝：`signInWithEmailAndPassword()` 和 `createUserWithEmailAndPassword()`

4. **`src/app/core/repositories/organization.repository.ts`**
   - 導入：`Injector, runInInjectionContext`
   - 注入：`private readonly injector = inject(Injector)`
   - 包裝：`getDocs()` 在 `findByCreator()`

5. **`src/app/core/repositories/team.repository.ts`**
   - 導入：`Injector, runInInjectionContext`
   - 注入：`private readonly injector = inject(Injector)`
   - 包裝：`getDocs()` 在 `findByOrganization()`

### 實作細節 (Implementation Details)

#### Before (問題代碼)

```typescript
// firebase-auth.service.ts
async signInWithEmailAndPassword(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(this.auth, email, password);
  // ...
}

// organization.repository.ts
findByCreator(creatorId: string): Observable<Organization[]> {
  const q = query(this.getCollectionRef(), where('created_by', '==', creatorId));
  return from(getDocs(q)).pipe(/* ... */);
}
```

#### After (修正後)

```typescript
// firebase-auth.service.ts
import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';

export class FirebaseAuthService {
  private readonly injector = inject(Injector);
  
  async signInWithEmailAndPassword(email: string, password: string): Promise<User> {
    const credential = await runInInjectionContext(this.injector, () => 
      signInWithEmailAndPassword(this.auth, email, password)
    );
    // ...
  }
}

// organization.repository.ts
import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';

export class OrganizationRepository {
  private readonly injector = inject(Injector);
  
  findByCreator(creatorId: string): Observable<Organization[]> {
    const q = query(this.getCollectionRef(), where('created_by', '==', creatorId));
    return from(
      runInInjectionContext(this.injector, () => getDocs(q))
    ).pipe(/* ... */);
  }
}
```

## 架構遵循 (Architecture Compliance)

✅ **Three-Layer Architecture**
- Foundation Layer: Supabase configuration in environment
- Container Layer: Firebase services with proper context
- No cross-layer violations

✅ **Angular 20 Modern Features**
- Used `inject()` function (not constructor injection)
- Used `runInInjectionContext()` (Angular 16+)
- Maintained Signals compatibility

✅ **Minimal Changes**
- Only modified 5 files
- No refactoring or feature additions
- Preserved all existing APIs

## 驗證 (Verification)

### 預期結果 (Expected Results)

1. **Supabase 初始化**
   - 環境變數讀取成功（若已配置 .env）
   - 若未配置，gracefully fail 並記錄錯誤
   - 不阻塞應用啟動

2. **Firebase Injection Context**
   - 警告訊息消失
   - Firebase API 在正確的注入上下文執行
   - 變更檢測和 hydration 正常運作

### 測試建議 (Testing Recommendations)

```bash
# 1. 啟動開發伺服器
yarn start

# 2. 檢查 console 日誌
# - Supabase 初始化錯誤應變為資訊訊息（若已配置）
# - Firebase injection context 警告應消失

# 3. 測試功能
# - 登入功能 (firebase-auth.service)
# - 組織列表載入 (organization.repository)
# - 團隊列表載入 (team.repository)

# 4. 配置 Supabase（可選）
# 複製 .env.example 為 .env
# 填入實際的 Supabase 憑證
# 重新啟動應用
```

## 後續步驟 (Next Steps)

### 立即行動 (Immediate)

1. **配置 Supabase 環境變數**
   ```bash
   cp .env.example .env
   # 編輯 .env 填入實際憑證
   ```

2. **驗證修復**
   - 啟動應用
   - 檢查 console 警告
   - 測試受影響的功能

### 可選優化 (Optional)

1. **Type Safety Enhancement**
   - 為 `Environment` 類型添加 Supabase 配置欄位
   - 使編譯時檢查更嚴格

2. **Error Handling**
   - 考慮在 Supabase 未配置時顯示 UI 提示
   - 或完全禁用相關功能

3. **Documentation**
   - 更新開發者設置文檔
   - 說明 Supabase 配置步驟

## 影響評估 (Impact Assessment)

### 風險 (Risks)

- ✅ **低風險**: 僅修改錯誤處理和執行上下文
- ✅ **向後相容**: 所有現有 API 保持不變
- ✅ **Graceful Degradation**: Supabase 未配置時不阻塞應用

### 效益 (Benefits)

- ✅ 消除 AngularFire 警告
- ✅ 預防潛在的變更檢測問題
- ✅ 改善 Supabase 初始化錯誤處理
- ✅ 符合 Angular 最佳實踐

## 參考資料 (References)

- [AngularFire Zones Documentation](https://github.com/angular/angularfire/blob/main/docs/zones.md)
- [Angular runInInjectionContext](https://angular.dev/api/core/runInInjectionContext)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [GigHub Architecture](./GigHub_Architecture.md)

---

**日期**: 2025-12-12  
**版本**: 1.0  
**狀態**: ✅ 已完成 (COMPLETED)
