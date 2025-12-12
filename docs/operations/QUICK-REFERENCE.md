# Supabase 遷移快速參考 🚀

> **快速查詢表** - 一頁搞定所有 Supabase 遷移指令

---

## 📦 安裝工具

```bash
# PostgreSQL 客戶端
brew install postgresql              # macOS
sudo apt install postgresql-client   # Ubuntu/Debian

# Supabase CLI
npm install -g supabase
yarn global add supabase
```

---

## 🔧 環境設定

```bash
# 1. 複製環境變數範本
cp .env.example .env

# 2. 編輯 .env 並填入憑證
nano .env

# 3. 驗證連接
supabase login
supabase link --project-ref your-project-id
```

**必要環境變數**:
```env
NG_APP_SUPABASE_URL=https://xxx.supabase.co
NG_APP_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
POSTGRES_URL_NON_POOLING=postgres://postgres.xxx:[password]@...
```

---

## 🚀 執行遷移 (擇一)

### 方法 1: Bash 腳本 (推薦)
```bash
# 所有遷移
yarn db:migrate
./scripts/apply-migrations.sh

# 特定遷移
./scripts/apply-migrations.sh 20251212_01_*
```

### 方法 2: Supabase CLI
```bash
# 所有遷移
yarn supabase:push
supabase db push

# 特定遷移
supabase db push --file supabase/migrations/20251212_01_create_tasks_table.sql
```

### 方法 3: Copilot Agent (MCP)
在 GitHub PR 評論：
```markdown
@copilot 使用 supabase MCP 應用 supabase/migrations/ 下的所有遷移
```

---

## 🔍 驗證部署

```bash
# 腳本驗證
yarn db:migrate:verify
node scripts/supabase-migrate.mjs

# SQL 驗證
psql "$POSTGRES_URL_NON_POOLING" << EOF
\dt tasks
\dt logs
SELECT tablename, COUNT(*) FROM pg_policies 
WHERE tablename IN ('tasks', 'logs') GROUP BY tablename;
EOF
```

---

## 🧪 測試查詢

```sql
-- 檢查表格
SELECT * FROM tasks LIMIT 5;
SELECT * FROM logs LIMIT 5;

-- 檢查 RLS
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('tasks', 'logs');

-- 檢查政策
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('tasks', 'logs');

-- 檢查索引
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename IN ('tasks', 'logs');
```

---

## 🛡️ 安全檢查

```bash
# 確認 .env 未提交
git status | grep .env && echo "⚠️  WARNING: .env is tracked!"

# 驗證 RLS 啟用
psql "$POSTGRES_URL_NON_POOLING" -c "
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('tasks', 'logs');"

# 測試跨組織隔離
# (需要在 Supabase SQL Editor 執行)
```

---

## 🔄 本地開發

```bash
# 啟動本地 Supabase
yarn supabase:start
supabase start

# 重置本地資料庫
yarn supabase:reset
supabase db reset

# 停止本地 Supabase
yarn supabase:stop
supabase stop

# 查看本地狀態
supabase status
```

**本地連接資訊**:
- API URL: `http://localhost:54321`
- DB URL: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio: `http://localhost:54323`

---

## 🆘 故障排除

| 問題 | 解決方案 |
|------|----------|
| `psql: command not found` | `brew install postgresql` (macOS) 或 `sudo apt install postgresql-client` (Ubuntu) |
| `POSTGRES_URL not set` | 檢查 `.env` 檔案是否存在且已載入 |
| `permission denied` | `chmod +x scripts/apply-migrations.sh` |
| `relation already exists` | 遷移已執行過，可忽略或手動檢查 |
| `RLS policy violation` | 檢查 JWT custom claims 是否包含 `organization_id` |

---

## 📊 常用 npm Scripts

```json
{
  "db:migrate": "執行所有遷移 (Bash)",
  "db:migrate:verify": "驗證遷移 (Node.js)",
  "supabase:push": "推送遷移 (CLI)",
  "supabase:reset": "重置本地資料庫",
  "supabase:start": "啟動本地 Supabase",
  "supabase:stop": "停止本地 Supabase"
}
```

---

## 🔗 快速連結

- 📘 [完整部署指南](./PR63-DEPLOYMENT-GUIDE.md)
- 🔧 [Supabase 設定指南](./supabase-setup-guide.md)
- 🤖 [Supabase MCP 指南](./supabase-mcp-guide.md)
- 📝 [Scripts README](../../scripts/README.md)
- 🌐 [Supabase Dashboard](https://supabase.com/dashboard)

---

## 📁 遷移檔案

```
supabase/migrations/
├── 20251212_01_create_tasks_table.sql    # 任務表格
├── 20251212_02_create_logs_table.sql     # 日誌表格
└── 20251212_03_create_rls_policies.sql   # RLS 政策
```

---

## 💡 最佳實踐

✅ **DO**:
- 在本地測試後再部署到生產環境
- 部署前備份資料庫
- 使用腳本自動化部署
- 驗證 RLS 政策正確運作
- 定期輪替金鑰

❌ **DON'T**:
- 不要提交 `.env` 到 Git
- 不要在前端使用 service_role_key
- 不要跳過 RLS 驗證
- 不要直接在生產環境測試

---

## 🎯 一鍵部署 (PR #63)

```bash
# 完整流程（推薦）
cp .env.example .env           # 1. 設定環境變數
nano .env                      # 2. 填入 Supabase 憑證
yarn db:migrate                # 3. 執行遷移
yarn db:migrate:verify         # 4. 驗證結果
```

或使用 GitHub Copilot:
```markdown
@copilot 使用 supabase MCP 部署 PR #63 的所有遷移
```

---

**版本**: 1.0.0  
**更新**: 2025-12-12  
**維護**: GigHub Dev Team
