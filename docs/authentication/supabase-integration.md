# Supabase 整合指南 (Supabase Integration Guide)

## 概述 (Overview)

SupabaseService 已簡化為僅處理統計數據和非敏感資料操作。所有身份驗證功能已移除，因為 Firebase Authentication 現在處理應用程式中的所有用戶身份驗證。

---

## 變更內容 (Changes Made)

### 1. 移除的身份驗證方法

以下與身份驗證相關的方法和屬性已移除：

- ❌ `session` - Auth session 管理
- ❌ `authChanges()` - Auth 狀態變更監聽器
- ❌ `signIn()` - OTP 登入
- ❌ `signInWithPassword()` - 密碼登入
- ❌ `signOut()` - 登出
- ❌ `profile()` - 用戶個人資料查詢
- ❌ `updateProfile()` - 更新用戶個人資料
- ❌ `downLoadImage()` - 頭像下載
- ❌ `uploadAvatar()` - 頭像上傳

### 2. 硬編碼憑證

憑證現在直接硬編碼在服務中，而不是來自環境檔案：

```typescript
// src/app/core/services/supabase.service.ts
private readonly SUPABASE_URL = 'https://edfxrqgadtlnfhqqmgjw.supabase.co';
private readonly SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZnhycWdhZHRsbmZocXFtZ2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODY4NDEsImV4cCI6MjA4MDc2Mjg0MX0.YRy5oDkScbPMOvbnybKDtMJIfO7Vf5a3AJoCclsSW_U';
```

**為什麼使用硬編碼？**
- Supabase 僅用於公開統計數據
- 不會暴露敏感資訊
- 簡化配置和部署
- 憑證可安全提交（公開資料的 anon key）

### 3. 從環境檔案中移除

Supabase 配置已從以下檔案中移除：
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

### 4. 新的簡化 API

服務現在提供三個簡單方法：

```typescript
class SupabaseService {
  // 獲取 Supabase client 實例
  get client(): SupabaseClient;
  
  // 從表格查詢資料
  from(table: string);
  
  // 訪問 Supabase storage
  storage(bucket: string);
}
```

---

## 遷移指南 (Migration Guide)

### 之前（舊的 SupabaseService）

```typescript
// 身份驗證（已移除）
await this.supabase.signInWithPassword(email, password);
await this.supabase.signOut();

// 個人資料管理（已移除）
await this.supabase.profile(user);
await this.supabase.updateProfile(profile);

// Storage 使用特定方法（已變更）
await this.supabase.downLoadImage(path);
await this.supabase.uploadAvatar(filePath, file);
```

### 之後（新的 SupabaseService）

```typescript
// 使用 Firebase 進行身份驗證
await this.firebaseAuth.signInWithEmailAndPassword(email, password);
await this.firebaseAuth.signOut();

// 個人資料管理 - 使用 Firebase 或您自己的服務
// （不再在 SupabaseService 中）

// Storage 使用通用 storage() 方法
const storage = this.supabase.storage('bucket-name');
await storage.download(path);
await storage.upload(filePath, file);
```

---

## 使用範例 (Usage Examples)

### 查詢統計數據

```typescript
import { SupabaseService } from '@core';

@Component({...})
export class DashboardComponent {
  private readonly supabase = inject(SupabaseService);

  async loadStatistics() {
    // 查詢統計表
    const { data, error } = await this.supabase
      .from('project_statistics')
      .select('*')
      .gte('date', '2024-01-01')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error loading statistics:', error);
      return;
    }

    this.statistics = data;
  }

  async loadAggregatedData() {
    // 使用 client 進行複雜查詢
    const { data } = await this.supabase.client
      .from('daily_stats')
      .select('date, sum(count) as total')
      .group('date');
    
    return data;
  }
}
```

### 訪問 Storage

```typescript
async downloadReport(filename: string) {
  const storage = this.supabase.storage('reports');
  const { data, error } = await storage.download(filename);
  
  if (error) {
    console.error('Error downloading report:', error);
    return;
  }
  
  // 處理檔案資料
  const blob = new Blob([data]);
  // ... 處理 blob
}

async uploadFile(file: File) {
  const storage = this.supabase.storage('statistics-files');
  const { data, error } = await storage.upload(
    `stats-${Date.now()}.csv`,
    file
  );
  
  if (error) {
    console.error('Error uploading file:', error);
    return;
  }
  
  console.log('File uploaded:', data);
}
```

---

## 安全考量 (Security Considerations)

### 為什麼硬編碼憑證是安全的

1. **僅 Anon Key**: 硬編碼的 key 是匿名（公開）key，而非 service role key
2. **RLS 政策**: Supabase Row Level Security (RLS) 政策控制資料訪問
3. **僅統計數據**: 僅存儲非敏感的公開統計數據
4. **無 Auth 資料**: 用戶身份驗證資料存儲在 Firebase，而非 Supabase
5. **只讀意圖**: 主要用例是讀取統計數據和報告

### 建議的 Supabase 設置

使用這些安全措施配置您的 Supabase 專案：

1. **在所有表上啟用 RLS**:
```sql
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
```

2. **為公開資料創建只讀政策**:
```sql
CREATE POLICY "Allow public read access to statistics"
ON statistics FOR SELECT
USING (true);
```

3. **限制寫入訪問**:
```sql
-- 僅允許從已驗證的 service role 插入
CREATE POLICY "Service role only insert"
ON statistics FOR INSERT
WITH CHECK (auth.role() = 'service_role');
```

---

## 使用場景 (Use Cases)

Supabase 現在用於：

### 1. 統計數據查詢

```typescript
// 查詢專案統計
const { data } = await this.supabase
  .from('project_stats')
  .select('*')
  .eq('project_id', projectId);
```

### 2. 報告生成

```typescript
// 下載生成的報告
const storage = this.supabase.storage('reports');
const { data } = await storage.download('monthly-report.pdf');
```

### 3. 資料分析

```typescript
// 聚合統計資料
const { data } = await this.supabase.client
  .rpc('calculate_project_metrics', { 
    start_date: '2024-01-01',
    end_date: '2024-12-31'
  });
```

### 4. 公開儀表板

```typescript
// 獲取公開儀表板資料
const { data } = await this.supabase
  .from('public_dashboards')
  .select('*')
  .eq('is_public', true);
```

---

## 優勢 (Benefits)

1. ✅ **更簡單的程式碼**: 移除了 8 個未使用的方法
2. ✅ **更清晰的目的**: 服務現在有單一職責（統計數據）
3. ✅ **更容易部署**: 不需要 Supabase 的環境變數
4. ✅ **更好的分離**: 身份驗證明確地與資料存儲分離
5. ✅ **保持靈活性**: 仍然可以進行複雜查詢和 storage 操作

---

## API 參考 (API Reference)

### `client`

獲取底層的 Supabase client 實例。

```typescript
const client = this.supabase.client;
const { data } = await client.from('table').select('*');
```

### `from(table: string)`

查詢指定表的資料。

**參數**:
- `table` - 表名

**返回**: Supabase query builder

```typescript
const { data, error } = await this.supabase
  .from('statistics')
  .select('*')
  .limit(10);
```

### `storage(bucket: string)`

訪問指定的 storage bucket。

**參數**:
- `bucket` - Bucket 名稱

**返回**: Supabase storage client

```typescript
const storage = this.supabase.storage('reports');
const { data } = await storage.list();
```

---

## 未來考量 (Future Considerations)

如果您需要擴展 Supabase 使用：

1. **添加新方法**: 為新用例創建特定方法
2. **保持簡單**: 維護簡單、專注的 API
3. **無 Auth 方法**: 繼續使用 Firebase 進行身份驗證
4. **記錄使用**: 為新模式添加範例到此檔案

---

## 修改的檔案 (Files Modified)

- ✏️ `src/app/core/services/supabase.service.ts` - 簡化的服務
- ✏️ `src/environments/environment.ts` - 移除 supabase 配置
- ✏️ `src/environments/environment.prod.ts` - 移除 supabase 配置

---

## 故障排除 (Troubleshooting)

### 問題: 無法連接到 Supabase

**解決方案**: 
1. 檢查 SUPABASE_URL 是否正確
2. 驗證 SUPABASE_ANON_KEY 是否有效
3. 確認專案在 Supabase 儀表板中處於活動狀態

### 問題: 查詢失敗並出現權限錯誤

**解決方案**:
1. 檢查 RLS 政策是否正確配置
2. 確認表上已啟用 RLS
3. 驗證查詢使用的是 anon key（而非 service role）

### 問題: Storage 訪問被拒絕

**解決方案**:
1. 檢查 bucket 政策
2. 確認 bucket 存在
3. 驗證檔案路徑正確

---

## 測試 (Testing)

### 測試統計查詢

```typescript
// 測試基本查詢
const { data, error } = await this.supabase
  .from('test_stats')
  .select('*')
  .limit(1);

if (error) {
  console.error('Query test failed:', error);
} else {
  console.log('Query test passed:', data);
}
```

### 測試 Storage 訪問

```typescript
// 測試列出檔案
const storage = this.supabase.storage('test-bucket');
const { data, error } = await storage.list();

if (error) {
  console.error('Storage test failed:', error);
} else {
  console.log('Storage test passed:', data);
}
```

---

## 總結 (Summary)

Supabase 服務現在是 Supabase client 的輕量級包裝器，用於統計數據和非敏感資料操作。所有身份驗證都由 Firebase 處理，使程式碼庫更清晰，職責更明確。

**關鍵要點**:
- ✅ 僅用於統計數據和公開資料
- ✅ 不處理任何身份驗證
- ✅ 硬編碼憑證安全（anon key + RLS）
- ✅ 簡單、專注的 API
- ✅ 易於維護和擴展

---

## 相關文檔 (Related Documentation)

- [Firebase Authentication](./firebase-authentication.md) - 主要身份驗證系統
- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

*文件版本: 1.0.0*  
*最後更新: 2025-01-09*  
*作者: GitHub Copilot AI Agent*  
*專案: GigHub - 工地施工進度追蹤管理系統*
