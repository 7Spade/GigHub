# Supabase 資料庫遷移指南

> **專案**: GigHub - 工地施工進度追蹤管理系統  
> **版本**: 1.0.0  
> **更新日期**: 2025-12-12

## 📚 目錄

1. [概述](#概述)
2. [前置需求](#前置需求)
3. [快速開始](#快速開始)
4. [遷移檔案說明](#遷移檔案說明)
5. [執行遷移](#執行遷移)
6. [驗證遷移](#驗證遷移)
7. [常見問題](#常見問題)
8. [安全最佳實踐](#安全最佳實踐)

---

## 概述

本專案使用 **Supabase** 作為後端資料庫服務，提供：
- PostgreSQL 17 資料庫
- Row Level Security (RLS) 政策
- 即時訂閱 (Realtime)
- 檔案儲存 (Storage)
- 認證整合 (Auth)

本指南說明如何將本地定義的資料庫遷移檔案推送到遠端 Supabase 資料庫。

---

## 前置需求

### 1. 安裝 Supabase CLI

**macOS (Homebrew)**:
```bash
brew install supabase/tap/supabase
```

**Linux**:
```bash
curl -fsSL https://github.com/supabase/cli/releases/download/v2.66.0/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

**Windows (Scoop)**:
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**驗證安裝**:
```bash
supabase --version
# 應顯示: 2.66.0 或更高版本
```

### 2. Supabase 專案設定

#### 選項 A: 使用現有專案

1. 登入 [Supabase Dashboard](https://app.supabase.com)
2. 找到您的專案 Project Reference (格式: `abc123xyz456`)
3. 取得以下憑證：
   - **Project URL**: `https://[project-ref].supabase.co`
   - **Anon Key**: 公開金鑰 (用於前端)
   - **Service Role Key**: 管理金鑰 (僅用於後端，切勿暴露)
   - **Database Password**: PostgreSQL 連線密碼

#### 選項 B: 建立新專案

1. 前往 [Supabase Dashboard](https://app.supabase.com)
2. 點擊 "New Project"
3. 填寫專案資訊：
   - **Name**: GigHub
   - **Database Password**: 設定強密碼（請記住此密碼）
   - **Region**: 選擇最接近使用者的區域（建議 `ap-northeast-1` - 東京）
4. 等待專案建立完成（約 2-3 分鐘）
5. 記錄 Project Reference 和憑證

### 3. 設定環境變數

複製 `.env.example` 並建立 `.env` 檔案：

```bash
cp .env.example .env
```

編輯 `.env` 並填入實際值：

```env
# Supabase Configuration (Frontend)
NG_APP_SUPABASE_URL=https://your-project-ref.supabase.co
NG_APP_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase Configuration (Backend Only - for migrations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_PASSWORD=your_database_password

# PostgreSQL Direct Connection
POSTGRES_URL=postgres://postgres.your-project-ref:password@aws-region.pooler.supabase.com:6543/postgres
```

⚠️ **重要**: 切勿將包含真實憑證的 `.env` 檔案提交至版本控制！

---

## 快速開始

### 方法 1: 使用 Bash 腳本（推薦）

#### 本地遷移（開發環境）

```bash
# 啟動本地 Supabase 並執行遷移
./scripts/supabase/run-migrations.sh --local

# 重置資料庫並重新執行所有遷移
./scripts/supabase/run-migrations.sh --local --reset
```

#### 遠端遷移（生產環境）

```bash
# 首次執行：連結到遠端專案
supabase link --project-ref your-project-ref

# 執行遷移
./scripts/supabase/run-migrations.sh --remote

# 預覽變更（不實際執行）
./scripts/supabase/run-migrations.sh --remote --dry-run
```

### 方法 2: 使用 TypeScript 腳本

```bash
# 安裝 ts-node (如果尚未安裝)
npm install -g ts-node

# 本地遷移
ts-node scripts/supabase/migrate.ts --mode=local

# 遠端遷移
ts-node scripts/supabase/migrate.ts --mode=remote --project-ref=your-project-ref

# 查看幫助
ts-node scripts/supabase/migrate.ts --help
```

### 方法 3: 使用 Supabase CLI 直接執行

```bash
# 本地環境
supabase start                  # 啟動本地 Supabase
supabase db push               # 推送遷移

# 遠端環境
supabase link --project-ref your-project-ref
supabase db push               # 推送遷移到遠端
```

---

## 遷移檔案說明

### 檔案結構

```
supabase/
├── config.toml                               # Supabase 專案配置
├── migrations/
│   ├── 20251212_01_create_tasks_table.sql    # 任務表格
│   ├── 20251212_02_create_logs_table.sql     # 日誌表格
│   └── 20251212_03_create_rls_policies.sql   # RLS 安全政策
└── seed.sql                                  # 種子資料（選用）
```

### 遷移 1: 建立任務表格 (Tasks)

**檔案**: `20251212_01_create_tasks_table.sql`

**功能**:
- 建立 `tasks` 表格用於追蹤工地任務
- 欄位包含：標題、描述、狀態、優先級、截止日期等
- 支援軟刪除 (`deleted_at`)
- 自動更新 `updated_at` 時間戳記
- 建立效能索引

**表格結構**:
```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  assignee_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'TODO',
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

### 遷移 2: 建立日誌表格 (Logs)

**檔案**: `20251212_02_create_logs_table.sql`

**功能**:
- 建立 `logs` 表格用於記錄施工日誌
- 支援照片、語音、文件附件
- 記錄天氣、工時、人力等資訊
- 自動統計照片數量

**表格結構**:
```sql
CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  work_hours NUMERIC(5, 2),
  workers INTEGER DEFAULT 0,
  equipment TEXT,
  weather VARCHAR(50),
  temperature NUMERIC(4, 1),
  photos JSONB DEFAULT '[]'::jsonb,
  voice_records JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);
```

### 遷移 3: RLS 安全政策

**檔案**: `20251212_03_create_rls_policies.sql`

**功能**:
- 啟用 Row Level Security (RLS)
- 實作組織隔離（不同組織無法存取彼此資料）
- 角色權限控制（admin / member）
- 創建者權限（只能修改自己的日誌）

**RLS 政策**:
```sql
-- Tasks 政策範例
CREATE POLICY "Users can view tasks in their organization"
ON public.tasks FOR SELECT
TO authenticated
USING (
  public.is_blueprint_in_user_organization(blueprint_id)
  AND deleted_at IS NULL
);

-- Logs 政策範例
CREATE POLICY "Users can create logs in their organization"
ON public.logs FOR INSERT
TO authenticated
WITH CHECK (
  public.is_blueprint_in_user_organization(blueprint_id)
  AND creator_id = public.get_user_id()
);
```

---

## 執行遷移

### 步驟 1: 檢查遷移狀態

```bash
# 查看尚未執行的遷移
supabase db diff

# 查看已執行的遷移
supabase migration list
```

### 步驟 2: 執行遷移

#### 本地環境

```bash
# 1. 啟動本地 Supabase
supabase start

# 2. 推送遷移
supabase db push

# 3. 查看結果
supabase status
```

**預期輸出**:
```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhb...
service_role key: eyJhb...
```

#### 遠端環境

```bash
# 1. 連結專案
supabase link --project-ref your-project-ref

# 2. 確認連線
supabase db remote ls

# 3. 推送遷移
supabase db push

# 4. 確認遷移成功
# 前往 Supabase Dashboard > Database > Tables
```

### 步驟 3: 驗證遷移

#### 使用 Supabase Studio (推薦)

**本地**: http://localhost:54323  
**遠端**: https://app.supabase.com/project/your-project-ref

1. 前往 **Table Editor**
2. 確認表格存在：`tasks`, `logs`
3. 檢查欄位結構是否正確
4. 前往 **Database > Policies**
5. 確認 RLS 政策已建立

#### 使用 SQL 查詢

```sql
-- 檢查表格是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tasks', 'logs');

-- 檢查 RLS 是否啟用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tasks', 'logs');

-- 檢查 RLS 政策數量
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('tasks', 'logs')
GROUP BY tablename;
```

---

## 驗證遷移

### 測試 Repository 功能

建立測試腳本 `scripts/supabase/test-repositories.ts`:

```typescript
import { TaskSupabaseRepository } from '@core/repositories/task-supabase.repository';
import { LogSupabaseRepository } from '@core/repositories/log-supabase.repository';

async function testRepositories() {
  const taskRepo = new TaskSupabaseRepository();
  const logRepo = new LogSupabaseRepository();
  
  try {
    // Test RLS validation
    console.log('Testing Task Repository RLS...');
    const taskRLS = await taskRepo.validateRLS();
    console.log(`Task RLS: ${taskRLS ? 'PASS' : 'FAIL'}`);
    
    console.log('Testing Log Repository RLS...');
    const logRLS = await logRepo.validateRLS();
    console.log(`Log RLS: ${logRLS ? 'PASS' : 'FAIL'}`);
    
    // Test CRUD operations
    console.log('\nTesting Task Creation...');
    const task = await taskRepo.create({
      blueprintId: 'test-blueprint-id',
      title: 'Test Task',
      description: 'Test Description',
      creatorId: 'test-user-id',
      status: TaskStatus.TODO,
      priority: 'MEDIUM'
    });
    console.log('Task created:', task.id);
    
    console.log('\nTesting Task Retrieval...');
    const retrievedTask = await taskRepo.findById(task.id);
    console.log('Task retrieved:', retrievedTask?.title);
    
    // Cleanup
    await taskRepo.delete(task.id);
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRepositories();
```

執行測試:
```bash
ts-node scripts/supabase/test-repositories.ts
```

### 測試 RLS 政策

```bash
# 使用 Supabase CLI 測試
supabase db test

# 或使用 psql 直接連線測試
psql $POSTGRES_URL

# 在 psql 中執行測試查詢
SELECT * FROM tasks;  # 應返回 0 rows (因為沒有認證)
```

---

## 常見問題

### Q1: 遷移失敗："relation already exists"

**原因**: 表格已存在於資料庫中

**解決方案**:
```bash
# 方法 1: 重置本地資料庫
supabase db reset

# 方法 2: 手動刪除表格
supabase db execute "DROP TABLE IF EXISTS tasks CASCADE;"
supabase db execute "DROP TABLE IF EXISTS logs CASCADE;"

# 方法 3: 使用 --reset 選項
./scripts/supabase/run-migrations.sh --local --reset
```

### Q2: RLS 政策阻擋存取

**症狀**: 查詢返回 0 rows 或 "permission denied"

**原因**: RLS 政策需要有效的 JWT token 和組織資訊

**解決方案**:
1. 確認使用者已登入 (Firebase Auth)
2. 確認 JWT claims 包含 `organization_id` 和 `role`
3. 暫時停用 RLS 進行測試:
   ```sql
   ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
   ALTER TABLE logs DISABLE ROW LEVEL SECURITY;
   ```

### Q3: 無法連線到遠端資料庫

**原因**: 憑證錯誤或網路問題

**解決方案**:
```bash
# 1. 重新連結專案
supabase link --project-ref your-project-ref --password your-password

# 2. 測試連線
supabase db remote ls

# 3. 檢查環境變數
echo $SUPABASE_ACCESS_TOKEN
echo $SUPABASE_DB_PASSWORD

# 4. 使用 --debug 查看詳細錯誤
supabase db push --debug
```

### Q4: 遷移順序錯誤

**症狀**: Foreign key constraint violation

**原因**: 遷移檔案的執行順序不正確

**解決方案**:
- 確認檔案命名遵循 `YYYYMMDD_NN_description.sql` 格式
- 按照數字順序執行（Supabase CLI 會自動排序）
- 如需調整順序，重新命名檔案

### Q5: 本地 Supabase 無法啟動

**症狀**: Docker 錯誤或連接埠衝突

**解決方案**:
```bash
# 1. 停止所有 Supabase 容器
supabase stop

# 2. 清理 Docker 資源
docker system prune -f

# 3. 重新啟動
supabase start

# 4. 檢查連接埠是否被占用
lsof -i :54321  # API port
lsof -i :54322  # DB port
lsof -i :54323  # Studio port
```

---

## 安全最佳實踐

### 1. 環境隔離

❌ **錯誤做法**:
```typescript
// 不要在前端使用 Service Role Key
const supabase = createClient(url, SERVICE_ROLE_KEY);
```

✅ **正確做法**:
```typescript
// 前端使用 Anon Key (受 RLS 保護)
const supabase = createClient(
  process.env.NG_APP_SUPABASE_URL!,
  process.env.NG_APP_SUPABASE_ANON_KEY!
);

// 後端腳本使用 Service Role Key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### 2. RLS 政策強制執行

❌ **錯誤做法**:
```sql
-- 允許所有人存取
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true);
```

✅ **正確做法**:
```sql
-- 基於組織隔離
CREATE POLICY "Organization isolation" ON tasks FOR SELECT
TO authenticated
USING (
  public.is_blueprint_in_user_organization(blueprint_id)
);
```

### 3. 金鑰輪替

**建議輪替週期**: 每 90 天

1. 前往 Supabase Dashboard > Settings > API
2. 點擊 "Generate new keys"
3. 更新所有環境的 `.env` 檔案
4. 重新部署應用程式
5. 撤銷舊金鑰

### 4. 資料備份

```bash
# 定期備份遠端資料庫
supabase db dump --db-url $POSTGRES_URL > backup_$(date +%Y%m%d).sql

# 恢復備份
supabase db reset --db-url $POSTGRES_URL
psql $POSTGRES_URL < backup_20251212.sql
```

### 5. 監控與告警

建議監控項目:
- API 請求量（異常流量）
- RLS 違規嘗試
- 資料庫連線數
- 查詢效能（慢查詢）

前往 Supabase Dashboard > Reports 查看詳細報表。

---

## 下一步

1. **設定 Firebase Auth** → Supabase 整合
   - 配置 JWT claims (organization_id, role)
   - 同步使用者資料

2. **建立 Storage Buckets**
   - `task-attachments` - 任務附件
   - `log-photos` - 日誌照片
   - 配置 Storage Policies

3. **實作 Realtime 訂閱**
   - 即時任務更新
   - 即時日誌新增

4. **效能優化**
   - 建立適當索引
   - 啟用連線池
   - 實作快取策略

---

## 參考資源

- [Supabase 官方文檔](https://supabase.com/docs)
- [Supabase CLI 指南](https://supabase.com/docs/guides/cli)
- [PostgreSQL RLS 教學](https://supabase.com/docs/guides/auth/row-level-security)
- [Angular + Supabase 整合](https://supabase.com/docs/guides/getting-started/quickstarts/angular)

---

**最後更新**: 2025-12-12  
**維護者**: GigHub Development Team  
**問題回報**: GitHub Issues
