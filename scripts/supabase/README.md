# Supabase Migration Scripts

## 📂 檔案說明

- **`run-migrations.sh`** - Bash 腳本，用於執行 Supabase 遷移
- **`migrate.ts`** - TypeScript 腳本，提供程式化遷移執行
- **`README.md`** - 本文件

## 🚀 快速開始

### 方法 1: 使用 npm/yarn 腳本（推薦）

```bash
# 本地遷移
yarn supabase:migrate:local

# 遠端遷移
yarn supabase:migrate:remote

# 重置資料庫並重新執行遷移
yarn supabase:migrate:reset

# 啟動 Supabase Studio
yarn supabase:studio
```

### 方法 2: 直接執行 Bash 腳本

```bash
# 賦予執行權限（首次執行）
chmod +x ./scripts/supabase/run-migrations.sh

# 本地遷移
./scripts/supabase/run-migrations.sh --local

# 遠端遷移
./scripts/supabase/run-migrations.sh --remote

# 預覽變更（dry run）
./scripts/supabase/run-migrations.sh --remote --dry-run

# 重置並重新執行
./scripts/supabase/run-migrations.sh --local --reset

# 查看幫助
./scripts/supabase/run-migrations.sh --help
```

### 方法 3: 使用 TypeScript 腳本

```bash
# 本地遷移
ts-node scripts/supabase/migrate.ts --mode=local

# 遠端遷移
ts-node scripts/supabase/migrate.ts --mode=remote --project-ref=abc123

# 預覽變更
ts-node scripts/supabase/migrate.ts --mode=remote --dry-run

# 查看幫助
ts-node scripts/supabase/migrate.ts --help
```

## 📋 前置需求

### 1. 安裝 Supabase CLI

**macOS**:
```bash
brew install supabase/tap/supabase
```

**Linux**:
```bash
curl -fsSL https://github.com/supabase/cli/releases/download/v2.66.0/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

**Windows**:
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env` 並填入實際值：

```env
NG_APP_SUPABASE_URL=https://your-project-ref.supabase.co
NG_APP_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_PASSWORD=your_db_password
```

### 3. 連結 Supabase 專案（僅遠端遷移需要）

```bash
supabase link --project-ref your-project-ref
```

## 🔧 腳本選項

### Bash 腳本選項

| 選項 | 說明 | 範例 |
|------|------|------|
| `--local` | 本地遷移（預設） | `./run-migrations.sh --local` |
| `--remote` | 遠端遷移 | `./run-migrations.sh --remote` |
| `--dry-run` | 預覽變更，不實際執行 | `./run-migrations.sh --remote --dry-run` |
| `--reset` | 重置資料庫並重新執行所有遷移 | `./run-migrations.sh --local --reset` |
| `--help` | 顯示幫助訊息 | `./run-migrations.sh --help` |

### TypeScript 腳本選項

| 選項 | 說明 | 範例 |
|------|------|------|
| `--mode=local` | 本地遷移 | `ts-node migrate.ts --mode=local` |
| `--mode=remote` | 遠端遷移 | `ts-node migrate.ts --mode=remote` |
| `--project-ref=<ref>` | Supabase 專案 ID | `ts-node migrate.ts --mode=remote --project-ref=abc123` |
| `--dry-run` | 預覽變更 | `ts-node migrate.ts --mode=remote --dry-run` |
| `--reset` | 重置資料庫 | `ts-node migrate.ts --mode=local --reset` |
| `--help` | 顯示幫助 | `ts-node migrate.ts --help` |

## 📝 使用範例

### 範例 1: 初次設定本地開發環境

```bash
# 1. 啟動 Supabase
yarn supabase:start

# 2. 執行遷移
yarn supabase:migrate:local

# 3. 開啟 Supabase Studio
yarn supabase:studio
# 訪問 http://localhost:54323
```

### 範例 2: 推送遷移到生產環境

```bash
# 1. 確認專案已連結
supabase link --project-ref your-prod-project-ref

# 2. 預覽變更
yarn supabase:migrate:remote --dry-run

# 3. 執行遷移
yarn supabase:migrate:remote

# 4. 驗證
# 前往 https://app.supabase.com 確認
```

### 範例 3: 重置本地資料庫

```bash
# 完全重置並重新執行所有遷移
yarn supabase:migrate:reset
```

### 範例 4: CI/CD 自動化

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Supabase CLI
        run: |
          curl -fsSL https://github.com/supabase/cli/releases/download/v2.66.0/supabase_linux_amd64.tar.gz | tar -xz
          sudo mv supabase /usr/local/bin/
      
      - name: Link Supabase Project
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Run Migrations
        run: |
          supabase db push
```

## 🧪 驗證遷移

### 檢查表格

```bash
# 使用 Supabase CLI
supabase db execute "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

# 或直接使用 psql
psql $POSTGRES_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

### 檢查 RLS 政策

```bash
# 查看 RLS 是否啟用
supabase db execute "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"

# 查看政策數量
supabase db execute "SELECT tablename, COUNT(*) FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename;"
```

### 測試 CRUD 操作

使用 Angular 應用程式測試：
```typescript
// 在 Angular DevTools Console 執行
const taskRepo = inject(TaskSupabaseRepository);
await taskRepo.validateRLS();  // 應返回 true
```

## 🐛 常見問題

### Q: 腳本執行失敗："permission denied"

**A**: 賦予執行權限
```bash
chmod +x ./scripts/supabase/run-migrations.sh
```

### Q: 無法連線到本地 Supabase

**A**: 確認 Docker 正在執行並啟動 Supabase
```bash
# 檢查 Docker
docker ps

# 啟動 Supabase
yarn supabase:start
```

### Q: 遷移衝突："relation already exists"

**A**: 重置資料庫
```bash
yarn supabase:migrate:reset
```

### Q: RLS 政策阻擋存取

**A**: 暫時停用 RLS 測試
```sql
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs DISABLE ROW LEVEL SECURITY;
```

## 📚 更多資訊

- **完整指南**: 參閱 `docs/SUPABASE_MIGRATION_GUIDE.md`
- **Supabase 文檔**: https://supabase.com/docs
- **專案 README**: `README.md`

## 🔗 相關資源

- [Supabase CLI 文檔](https://supabase.com/docs/guides/cli)
- [PostgreSQL RLS 教學](https://supabase.com/docs/guides/auth/row-level-security)
- [Angular + Supabase 整合](https://supabase.com/docs/guides/getting-started/quickstarts/angular)

---

**維護者**: GigHub Development Team  
**最後更新**: 2025-12-12
