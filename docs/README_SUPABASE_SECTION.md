# Supabase Integration Section

> **注意**: 以下內容應添加到主 README.md 中

## 🗄️ Supabase 資料庫整合

本專案使用 **Supabase** 作為後端資料庫服務，提供：
- PostgreSQL 17 資料庫
- Row Level Security (RLS) 安全政策
- 即時訂閱 (Realtime)
- 檔案儲存 (Storage)
- 認證整合 (Auth)

### 快速開始

#### 1. 安裝 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://github.com/supabase/cli/releases/download/v2.66.0/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### 2. 設定環境變數

```bash
# 複製環境變數範本
cp .env.example .env

# 編輯 .env 並填入 Supabase 憑證
nano .env
```

#### 3. 執行資料庫遷移

**本地開發環境**:
```bash
# 啟動本地 Supabase
yarn supabase:start

# 執行遷移
yarn supabase:migrate:local

# 開啟 Supabase Studio
yarn supabase:studio
# 訪問 http://localhost:54323
```

**遠端環境**:
```bash
# 連結專案
supabase link --project-ref your-project-ref

# 執行遷移
yarn supabase:migrate:remote
```

### 資料庫架構

本專案包含以下主要資料表：

- **`tasks`** - 任務管理表格
  - 任務標題、描述、狀態
  - 優先級、截止日期
  - 負責人、創建者
  - 附件與標籤

- **`logs`** - 施工日誌表格
  - 日期、標題、描述
  - 工時、人力、設備
  - 天氣、溫度
  - 照片、語音、文件附件

### 可用腳本

| 指令 | 說明 |
|------|------|
| `yarn supabase:start` | 啟動本地 Supabase |
| `yarn supabase:stop` | 停止本地 Supabase |
| `yarn supabase:status` | 檢查 Supabase 狀態 |
| `yarn supabase:migrate:local` | 執行本地遷移 |
| `yarn supabase:migrate:remote` | 執行遠端遷移 |
| `yarn supabase:migrate:reset` | 重置並重新遷移 |
| `yarn supabase:studio` | 開啟 Supabase Studio |

### 詳細文件

- 📖 [完整遷移指南](docs/SUPABASE_MIGRATION_GUIDE.md)
- 🔧 [腳本使用說明](scripts/supabase/README.md)
- 🔐 [GitHub Secrets 設定](docs/GITHUB_SECRETS_SETUP.md)

### CI/CD 自動化

專案包含 GitHub Actions workflow 用於自動化資料庫遷移：

- **觸發條件**:
  - Push to `main` branch → Production 遷移
  - Push to `develop` branch → Development 遷移
  - Manual workflow dispatch → 選擇環境執行

- **功能**:
  - 自動驗證遷移檔案
  - 支援 dry-run 預覽
  - Production 自動備份
  - 多環境支援（dev/staging/prod）

查看 [.github/workflows/supabase-migrations.yml](.github/workflows/supabase-migrations.yml) 了解詳情。

### 安全最佳實踐

✅ **建議做法**:
- 前端使用 Anon Key（受 RLS 保護）
- 後端腳本使用 Service Role Key
- 不同環境使用獨立專案
- 定期輪替金鑰（每 90 天）
- 啟用 RLS 政策保護資料

❌ **禁止做法**:
- 切勿在前端暴露 Service Role Key
- 切勿提交 `.env` 檔案至版本控制
- 切勿在日誌中輸出敏感資訊
- 切勿在多個環境共用金鑰

### Repository 模式

專案實作了完整的 Repository Pattern：

```typescript
import { inject } from '@angular/core';
import { TaskSupabaseRepository } from '@core/repositories/task-supabase.repository';
import { LogSupabaseRepository } from '@core/repositories/log-supabase.repository';

export class TaskService {
  private taskRepo = inject(TaskSupabaseRepository);
  
  async createTask(data: CreateTaskRequest) {
    return this.taskRepo.create(data);
  }
  
  async findTasksByBlueprint(blueprintId: string) {
    return this.taskRepo.findByBlueprint(blueprintId);
  }
}
```

### 疑難排解

#### 問題: 無法連線到本地 Supabase

**解決方案**:
```bash
# 檢查 Docker 是否執行
docker ps

# 重新啟動 Supabase
yarn supabase:stop
yarn supabase:start
```

#### 問題: RLS 政策阻擋存取

**解決方案**:
```sql
-- 暫時停用 RLS（僅供測試）
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs DISABLE ROW LEVEL SECURITY;
```

#### 問題: 遷移失敗 "relation already exists"

**解決方案**:
```bash
# 重置資料庫
yarn supabase:migrate:reset
```

更多問題請參考 [完整遷移指南](docs/SUPABASE_MIGRATION_GUIDE.md#常見問題)。

---

**相關連結**:
- [Supabase 官方文檔](https://supabase.com/docs)
- [Supabase CLI 指南](https://supabase.com/docs/guides/cli)
- [PostgreSQL RLS 教學](https://supabase.com/docs/guides/auth/row-level-security)
