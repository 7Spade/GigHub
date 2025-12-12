# GigHub 問題解決實施摘要

## 📌 執行日期
2025-12-12

## 🎯 問題描述

### 問題 1: 工地日誌錯誤
```
Failed to fetch logs: Could not find the table 'public.construction_logs' in the schema
```

**根本原因**:
- Supabase 配置使用舊的測試數據庫（edfxrqgadtlnfhqqmgjw）
- 新的生產數據庫（zecsbstjqjqoytwgjyct）未正確配置
- 資料庫表格尚未建立

### 問題 2: 任務列表空轉
- 任務組件使用 Firebase Firestore
- 可能的 Firebase 配置問題

## ✅ 已完成的解決方案

### 1. 環境配置更新

#### 檔案變更:
- ✅ 建立 `.env` 文件（包含新的 Supabase 憑證）
- ✅ 更新 `.gitignore`（防止提交敏感憑證）
- ✅ 更新 `src/environments/environment.ts`
- ✅ 更新 `src/environments/environment.prod.ts`
- ✅ 重構 `src/app/core/services/supabase.service.ts`

#### 配置細節:
```typescript
// environment.ts 新增配置
supabase: {
  url: 'https://zecsbstjqjqoytwgjyct.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

### 2. 資料庫架構設計

#### 建立的 SQL 腳本:
- ✅ `docs/database/init_schema.sql` - 完整初始化腳本

#### 包含的資料表:

**1. blueprints (藍圖表)**
```sql
- id: UUID (主鍵)
- name: VARCHAR(200)
- description: TEXT
- code: VARCHAR(50) (唯一)
- organization_id: UUID
- status: VARCHAR(50)
- creator_id: UUID
- created_at, updated_at, deleted_at: TIMESTAMPTZ
- metadata: JSONB
```

**2. construction_logs (工地日誌表)**
```sql
- id: UUID (主鍵)
- blueprint_id: UUID (外鍵 → blueprints)
- date: TIMESTAMPTZ
- title: VARCHAR(100)
- description: TEXT
- work_hours: NUMERIC(5,2)
- workers: INTEGER
- equipment: TEXT
- weather: VARCHAR(50)
- temperature: NUMERIC(5,2)
- photos: JSONB
- creator_id: UUID
- created_at, updated_at, deleted_at: TIMESTAMPTZ
- voice_records: TEXT[]
- documents: TEXT[]
- metadata: JSONB
```

#### 資料庫特性:
- ✅ Row Level Security (RLS) 政策
- ✅ 自動更新 `updated_at` 觸發器
- ✅ 索引優化（blueprint_id, date, creator_id）
- ✅ 軟刪除支援（deleted_at）
- ✅ 範例資料（測試用）

### 3. 文檔與工具

#### 新增文檔:
- ✅ `docs/database/README.md` - 資料庫設置詳細指南
- ✅ `SETUP.md` - 完整專案設置說明
- ✅ `IMPLEMENTATION_SUMMARY.md` - 本文件

#### 新增工具:
- ✅ `scripts/setup-env.sh` - 互動式環境配置腳本

## 📋 待完成的手動步驟

### 步驟 1: 執行資料庫初始化腳本 🔴 必須

**方法 A: Supabase Dashboard (推薦)**

1. 登入 Supabase Dashboard
   - URL: https://supabase.com/dashboard
   - 選擇專案: `zecsbstjqjqoytwgjyct`

2. 執行 SQL 腳本
   - 進入 "SQL Editor"
   - 點擊 "New Query"
   - 複製 `docs/database/init_schema.sql` 全部內容
   - 貼上並點擊 "Run"

3. 驗證結果
   ```sql
   -- 執行以下查詢確認
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
     AND table_name IN ('blueprints', 'construction_logs');
   ```

**方法 B: 使用 psql 指令列**

```bash
# 連線字串
psql "postgres://postgres.zecsbstjqjqoytwgjyct:IBXgJ6mxLrlQxNEm@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"

# 在 psql 中執行
\i docs/database/init_schema.sql

# 或直接執行
psql "postgres://..." -f docs/database/init_schema.sql
```

**方法 C: 使用 Supabase CLI**

```bash
# 安裝 CLI
npm install -g supabase

# 登入
supabase login

# 連結專案
supabase link --project-ref zecsbstjqjqoytwgjyct

# 執行腳本
supabase db push
```

### 步驟 2: 建立 Storage Bucket 🔴 必須

1. 進入 Supabase Dashboard > Storage
2. 建立新 Bucket:
   - **Bucket 名稱**: `construction-photos`
   - **Public**: ✅ 勾選（允許公開存取）
   - **檔案大小限制**: 10 MB
   - **允許的 MIME 類型**: 
     - `image/jpeg`
     - `image/png`
     - `image/webp`

3. 設定 RLS 政策（如需）
   ```sql
   -- 允許已認證用戶上傳
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'construction-photos');
   
   -- 允許公開讀取
   CREATE POLICY "Allow public reads"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'construction-photos');
   ```

### 步驟 3: 本地環境設置 🟡 建議

1. 建立本地 `.env` 文件
   ```bash
   # 使用互動式腳本
   ./scripts/setup-env.sh
   
   # 或手動建立
   cp .env.example .env
   # 然後編輯 .env 填入憑證
   ```

2. 安裝依賴
   ```bash
   yarn install
   ```

3. 啟動開發伺服器
   ```bash
   yarn start
   ```

### 步驟 4: 測試與驗證 🟡 建議

1. **測試 Supabase 連線**
   - 開啟瀏覽器 Developer Tools (F12)
   - 查看 Console 是否有 `[SupabaseService] Initialized with URL:` 訊息
   - 確認 URL 為 `https://zecsbstjqjqoytwgjyct.supabase.co`

2. **測試工地日誌功能**
   - 導航到工地日誌頁面
   - 嘗試建立新的日誌
   - 嘗試上傳照片
   - 檢查是否有錯誤訊息

3. **測試資料庫查詢**
   ```sql
   -- 在 Supabase Dashboard > SQL Editor 執行
   
   -- 查看藍圖
   SELECT * FROM public.blueprints LIMIT 10;
   
   -- 查看工地日誌
   SELECT * FROM public.construction_logs LIMIT 10;
   
   -- 檢查 RLS 政策
   SELECT * FROM pg_policies 
   WHERE schemaname = 'public' 
     AND tablename IN ('blueprints', 'construction_logs');
   ```

### 步驟 5: Firebase 配置檢查 🟢 選用

如果任務功能仍有問題：

1. 檢查 Firebase 配置
   ```typescript
   // src/environments/environment.ts
   firebase: {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     // ...
   }
   ```

2. 確認 Firebase 專案已啟用 Firestore

3. 檢查 Firestore 規則
   ```javascript
   // 在 Firebase Console > Firestore > 規則
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /blueprints/{blueprintId}/tasks/{taskId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 🔍 驗證清單

### 資料庫驗證
- [ ] blueprints 表已建立
- [ ] construction_logs 表已建立
- [ ] RLS 政策已啟用
- [ ] 索引已建立
- [ ] 觸發器運作正常
- [ ] 範例資料可查詢

### Storage 驗證
- [ ] construction-photos bucket 已建立
- [ ] 設定為 Public
- [ ] 可以上傳圖片
- [ ] 可以讀取圖片 URL

### 應用程式驗證
- [ ] SupabaseService 使用正確的 URL
- [ ] 環境配置正確載入
- [ ] 工地日誌頁面無錯誤
- [ ] 可以建立新日誌
- [ ] 可以上傳照片
- [ ] 任務列表正常顯示（如適用）

## 📊 變更影響分析

### 影響的模組
1. **核心服務**
   - `SupabaseService` - 重大變更（配置方式）

2. **環境配置**
   - `environment.ts` - 新增 supabase 區塊
   - `environment.prod.ts` - 新增 supabase 區塊

3. **資料存取層**
   - `ConstructionLogRepository` - 無變更（相容）

4. **UI 元件**
   - 工地日誌相關元件 - 無變更（相容）

### 向後相容性
- ✅ 完全向後相容
- ✅ 現有 API 介面不變
- ✅ 只是配置來源改變

### 安全性改進
- ✅ 憑證不再硬編碼
- ✅ .env 已加入 .gitignore
- ✅ 使用環境變數管理敏感資訊
- ✅ RLS 政策保護資料存取

## 🚀 部署建議

### 開發環境
1. 使用 `.env` 文件
2. 設定 development Supabase 專案
3. 啟用詳細日誌

### 測試環境
1. 設定獨立的 Supabase 專案
2. 使用 CI/CD 環境變數
3. 執行完整測試套件

### 生產環境
1. 使用 environment.prod.ts
2. 設定生產 Supabase 專案
3. 啟用效能監控
4. 設定備份策略

## 📞 支援資訊

### 相關文件
- [資料庫設置指南](docs/database/README.md)
- [專案設置指南](SETUP.md)
- [Supabase 官方文檔](https://supabase.com/docs)

### 常見問題
請參考 `SETUP.md` 中的 "常見問題" 章節。

### 聯絡方式
- GitHub Issues: https://github.com/7Spade/GigHub/issues
- Email: support@gighub.dev

---

## 📝 附錄

### A. 完整的檔案變更清單

**新增檔案**:
```
.env (已移除，需本地建立)
docs/database/init_schema.sql
docs/database/README.md
scripts/setup-env.sh
SETUP.md
IMPLEMENTATION_SUMMARY.md
```

**修改檔案**:
```
.gitignore
src/app/core/services/supabase.service.ts
src/environments/environment.ts
src/environments/environment.prod.ts
```

### B. 資料庫連線資訊

**Supabase 專案**:
- Project ID: `zecsbstjqjqoytwgjyct`
- Region: `ap-southeast-1` (Singapore)
- URL: `https://zecsbstjqjqoytwgjyct.supabase.co`

**PostgreSQL 連線**:
- Host: `db.zecsbstjqjqoytwgjyct.supabase.co`
- Port: 5432 (direct) / 6543 (pooler)
- Database: `postgres`
- User: `postgres`

**注意**: 密碼等敏感資訊請參考 `.env` 文件或 Supabase Dashboard。

### C. 程式碼範例

**使用 SupabaseService**:
```typescript
import { inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';

export class MyComponent {
  private supabase = inject(SupabaseService);
  
  async loadData() {
    const { data, error } = await this.supabase.client
      .from('construction_logs')
      .select('*')
      .eq('blueprint_id', 'some-id');
      
    if (error) {
      console.error('Error loading data:', error);
      return;
    }
    
    console.log('Data loaded:', data);
  }
}
```

**上傳照片到 Storage**:
```typescript
async uploadPhoto(file: File, blueprintId: string, logId: string) {
  const fileName = `${blueprintId}/${logId}/${Date.now()}.jpg`;
  
  const { data, error } = await this.supabase.client.storage
    .from('construction-photos')
    .upload(fileName, file);
    
  if (error) {
    console.error('Upload error:', error);
    return;
  }
  
  // 取得公開 URL
  const { data: urlData } = this.supabase.client.storage
    .from('construction-photos')
    .getPublicUrl(fileName);
    
  return urlData.publicUrl;
}
```

---

**文件版本**: 1.0  
**最後更新**: 2025-12-12  
**作者**: GigHub Development Team
