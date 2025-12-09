# Core 核心層 AGENTS.md

本檔案涵蓋 `src/app/core/` 目錄下的核心服務、守衛、錯誤處理與基礎設施。

## 目錄結構

```
src/app/core/
├── services/          # 全域單例服務
│   ├── firebase-auth.service.ts     # Firebase 認證
│   ├── logger.service.ts            # 日誌記錄
│   └── permission.service.ts        # 權限檢查
├── guards/            # 路由守衛
│   ├── auth.guard.ts                # 認證守衛
│   └── permission.guard.ts          # 權限守衛
├── errors/            # 自訂錯誤類別
├── infra/             # 基礎設施層
│   └── repositories/  # 資料存取 Repositories
└── startup/           # 應用啟動邏輯
```

## 開發環境提示

### 後端整合

- **主要後端**: Firebase/Firestore (`@angular/fire 20.0.1`)
- **統計查詢**: Supabase (`@supabase/supabase-js 2.86.x`) - 僅用於只讀統計
- **資料庫操作**: 透過 Repository 模式存取 Firestore
- **認證**: Firebase Auth (`@angular/fire/auth`)

### 新增 Service

```bash
# 全域 Service (singleton)
ng generate service core/services/[service-name]

# 自動設定 providedIn: 'root'
```

### 新增 Repository

```bash
# 建立 Repository
mkdir -p src/app/core/infra/repositories/[entity]
touch src/app/core/infra/repositories/[entity]/[entity].repository.ts
```

## 程式碼模式

### Service 範本

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class MyService {
  private auth = inject(Auth);
  private repository = inject(MyRepository);
  
  // 共享狀態 (如需)
  private _data = signal<Data[]>([]);
  data = this._data.asReadonly();
  
  async fetchData(): Promise<Data[]> {
    try {
      const data = await this.repository.list();
      this._data.set(data);
      return data;
    } catch (error) {
      console.error('fetchData error:', error);
      throw error;
    }
  }
}
```

### Repository 範本 (Firestore)

```typescript
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  Timestamp 
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class MyRepository {
  private firestore = inject(Firestore);
  private collectionName = 'my_table';
  
  async list(filter?: Record<string, any>): Promise<MyEntity[]> {
    const collectionRef = collection(this.firestore, this.collectionName);
    const constraints = [where('deleted_at', '==', null)];
    
    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        constraints.push(where(key, '==', value));
      }
    }
    
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MyEntity[];
  }
  
  async getById(id: string): Promise<MyEntity | null> {
    const docRef = doc(this.firestore, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return { id: docSnap.id, ...docSnap.data() } as MyEntity;
  }
  
  async create(entity: Partial<MyEntity>): Promise<MyEntity> {
    const collectionRef = collection(this.firestore, this.collectionName);
    const docRef = await addDoc(collectionRef, {
      ...entity,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });
    
    return this.getById(docRef.id) as Promise<MyEntity>;
  }
  
  async update(id: string, entity: Partial<MyEntity>): Promise<MyEntity> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await updateDoc(docRef, {
      ...entity,
      updated_at: Timestamp.now()
    });
    
    return this.getById(id) as Promise<MyEntity>;
  }
  
  async softDelete(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.collectionName, id);
    await updateDoc(docRef, {
      deleted_at: Timestamp.now()
    });
  }
}
```

### Functional Guard 範本

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { FirebaseAuthService } from '@core/services/firebase-auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(FirebaseAuthService);
  const router = inject(Router);
  
  if (auth.currentUser) {
    return true;
  }
  
  return router.createUrlTree(['/passport/login'], {
    queryParams: { returnUrl: state.url }
  });
};

export const permissionGuard = (action: string): CanActivateFn => {
  return async (route, state) => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);
    
    const id = route.paramMap.get('id');
    if (!id) return router.createUrlTree(['/exception/403']);
    
    const hasPermission = await permissionService.checkPermission(id, action);
    
    if (hasPermission) return true;
    
    return router.createUrlTree(['/exception/403']);
  };
};
```

### 錯誤處理模式

```typescript
// 自訂錯誤類別
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' | 'critical',
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Service 中使用
async getData(id: string): Promise<Data> {
  try {
    const data = await this.repository.getById(id);
    
    if (!data) {
      throw new AppError(
        'Data not found',
        'DATA_NOT_FOUND',
        'high',
        false
      );
    }
    
    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw new AppError(
      'Failed to load data',
      'DATA_LOAD_FAILED',
      'high',
      true
    );
  }
}
```

## 測試指引

### Service 測試

```typescript
import { TestBed } from '@angular/core/testing';
import { MyService } from './my.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('MyService', () => {
  let service: MyService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MyService,
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(MyService);
  });
  
  it('should create', () => {
    expect(service).toBeTruthy();
  });
  
  it('should fetch data', async () => {
    const data = await service.fetchData();
    expect(data).toBeDefined();
  });
});
```

### Guard 測試

```typescript
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let router: Router;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([])
      ]
    });
    router = TestBed.inject(Router);
  });
  
  it('should allow access when authenticated', async () => {
    // Mock authentication
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );
    
    expect(result).toBe(true);
  });
});
```

## 常見問題

### Q: Firebase vs Supabase 使用時機?

**A**:
- **Firebase/Firestore**: 所有應用資料 (blueprints, tasks, users)
- **Supabase**: 僅用於只讀統計查詢

### Q: 如何處理 Firestore 錯誤?

**A**: 使用 try-catch 並轉換為自訂錯誤
```typescript
try {
  const data = await getDoc(docRef);
} catch (error) {
  if (error.code === 'permission-denied') {
    throw new AppError('Permission denied', 'PERMISSION_DENIED', 'high', false);
  }
  throw new AppError('Failed to fetch', 'FETCH_FAILED', 'high', true);
}
```

### Q: 如何快取權限檢查?

**A**: 使用 Map 快取並設定 TTL
```typescript
private cache = new Map<string, { value: boolean; timestamp: number }>();
private CACHE_TTL = 5 * 60 * 1000; // 5 分鐘

async checkPermission(id: string, action: string): Promise<boolean> {
  const cacheKey = `${id}:${action}`;
  const cached = this.cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
    return cached.value;
  }
  
  const result = await this.doCheck(id, action);
  this.cache.set(cacheKey, { value: result, timestamp: Date.now() });
  return result;
}
```

## PR 提交檢查清單

- [ ] Service 使用 `providedIn: 'root'`
- [ ] Repository 使用 @angular/fire API
- [ ] Guard 為 functional 而非 class-based
- [ ] 錯誤處理完整 (try-catch)
- [ ] 類型化錯誤 (自訂 Error 類別)
- [ ] 測試通過
- [ ] Lint 通過
- [ ] JSDoc 註解完整

## 相關文檔

- **專案根目錄**: `../../AGENTS.md`
- **應用層**: `../AGENTS.md`
- **共享元件**: `../shared/AGENTS.md`

---

**版本**: 2.0.0 (簡化版)  
**最後更新**: 2025-12-09
