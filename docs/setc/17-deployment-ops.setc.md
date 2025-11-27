# 17-deployment-ops.setc.md

## 1. 模組概述

### 業務價值
部署與維運確保系統的可靠交付與持續運行：
- **持續交付**：自動化的建置與部署流程
- **環境一致性**：各環境配置標準化
- **高可用性**：監控告警與故障恢復
- **資料安全**：完善的備份與恢復策略

### 核心功能
1. **CI/CD Pipeline**：自動化建置、測試、部署
2. **環境配置**：開發、測試、生產環境管理
3. **監控告警**：系統健康狀態監測
4. **備份恢復**：資料保護與災難恢復

### 在系統中的定位
部署與維運是系統上線後的最終階段，確保開發成果能穩定、安全地交付給用戶。

---

## 2. 功能需求

### 維運需求清單

#### OPS-001: CI/CD Pipeline
**需求**：實現自動化的持續整合與部署

**驗收標準**：
- [ ] 程式碼提交觸發自動建置
- [ ] 自動執行單元測試與整合測試
- [ ] 測試通過後自動部署到 Staging
- [ ] 支援手動觸發 Production 部署
- [ ] 部署失敗自動回滾

#### OPS-002: 環境管理
**需求**：標準化各環境配置

**驗收標準**：
- [ ] Development 環境配置完整
- [ ] Staging 環境與 Production 一致
- [ ] Production 環境安全配置
- [ ] 環境變數安全管理
- [ ] 資料庫遷移自動化

#### OPS-003: 監控告警
**需求**：實現系統健康監測與告警

**驗收標準**：
- [ ] 應用程式健康檢查
- [ ] 資料庫連線監控
- [ ] API 響應時間監控
- [ ] 錯誤率監控與告警
- [ ] 資源使用率告警

#### OPS-004: 備份恢復
**需求**：確保資料安全與災難恢復能力

**驗收標準**：
- [ ] 資料庫每日自動備份
- [ ] 檔案儲存定期備份
- [ ] 備份驗證與恢復測試
- [ ] 跨區域備份儲存
- [ ] RTO < 4 小時，RPO < 1 小時

### 優先級與依賴關係

| 優先級 | 功能 | 依賴 |
|--------|------|------|
| P0 | CI/CD 基礎流程 | GitHub Actions |
| P0 | 環境配置管理 | Supabase |
| P1 | 自動化部署 | CI/CD 基礎 |
| P1 | 監控基礎設施 | 部署完成 |
| P2 | 告警系統 | 監控基礎設施 |
| P2 | 備份策略 | 環境配置 |
| P3 | 災難恢復 | 備份策略 |

---

## 3. 技術設計

### CI/CD Pipeline 架構

```
程式碼提交 (Push/PR)
    │
    ▼
┌─────────────────┐
│  Lint & Format  │ ─── ESLint, Prettier
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build         │ ─── ng build --configuration=production
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Unit Tests    │ ─── ng test --no-watch --code-coverage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  E2E Tests     │ ─── Playwright
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Security Scan │ ─── npm audit, OWASP
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Staging    Production
(自動)      (手動審批)
```

### GitHub Actions Workflow

**主要 CI Pipeline**：
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn lint

  build:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn build --configuration=production
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn test --no-watch --code-coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: npx playwright install --with-deps
      - run: yarn e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  security:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn audit --level high

  deploy-staging:
    needs: [test, e2e, security]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - name: Deploy to Staging
        run: |
          # 部署到 Staging 環境
          echo "Deploying to staging..."

  deploy-production:
    needs: [test, e2e, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - name: Deploy to Production
        run: |
          # 部署到 Production 環境
          echo "Deploying to production..."
```

### 環境配置

**環境定義**：

| 環境 | 用途 | 資料 | 存取限制 |
|------|------|------|----------|
| development | 開發測試 | 模擬資料 | 開發團隊 |
| staging | 預發布驗證 | 生產資料快照 | 內部團隊 |
| production | 正式環境 | 真實資料 | 全用戶 |

**環境變數管理**：
```typescript
// environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'SUPABASE_URL',
  supabaseKey: 'SUPABASE_ANON_KEY',
  apiBaseUrl: '/api',
  sentryDsn: '',
};

// environment.staging.ts
export const environment = {
  production: false,
  supabaseUrl: 'https://staging.supabase.co',
  supabaseKey: '${STAGING_SUPABASE_KEY}',
  apiBaseUrl: 'https://staging-api.example.com',
  sentryDsn: '${STAGING_SENTRY_DSN}',
};

// environment.prod.ts
export const environment = {
  production: true,
  supabaseUrl: 'https://prod.supabase.co',
  supabaseKey: '${PROD_SUPABASE_KEY}',
  apiBaseUrl: 'https://api.example.com',
  sentryDsn: '${PROD_SENTRY_DSN}',
};
```

### 資料庫遷移策略

**Supabase Migrations**：
```bash
# 建立新遷移
supabase migration new add_new_table

# 套用遷移
supabase db push

# 回滾遷移
supabase db reset
```

**遷移檔案範例**：
```sql
-- supabase/migrations/20240101000000_add_audit_log.sql

-- 建立稽核日誌表
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  actor_id UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 建立索引
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 啟用 RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS 政策：只有管理員可以查看
CREATE POLICY "admins_can_view_audit_logs" ON audit_logs
  FOR SELECT
  USING (is_platform_admin());
```

### 監控告警系統

**健康檢查端點**：
```typescript
// health-check.service.ts
@Injectable({ providedIn: 'root' })
export class HealthCheckService {
  private readonly supabase = inject(SupabaseService);

  async checkHealth(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [
      await this.checkDatabase(),
      await this.checkStorage(),
      await this.checkAuth(),
    ];

    const allHealthy = checks.every(c => c.status === 'healthy');
    
    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    try {
      const start = Date.now();
      await this.supabase.client.from('blueprints').select('count').limit(1);
      return {
        name: 'database',
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      return { name: 'database', status: 'unhealthy', error: error.message };
    }
  }
}
```

**告警規則配置**：
```yaml
# alerting-rules.yaml
groups:
  - name: gighub-alerts
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"

      - alert: SlowResponseTime
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow API response time"
          description: "P99 latency is {{ $value }}s"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count / pg_settings_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool nearly exhausted"
```

### 備份策略

**備份類型**：

| 備份類型 | 頻率 | 保留期限 | 儲存位置 |
|----------|------|----------|----------|
| 全量備份 | 每日 | 30 天 | 異地儲存 |
| 增量備份 | 每小時 | 7 天 | 同區儲存 |
| WAL 備份 | 持續 | 7 天 | 同區儲存 |
| 檔案備份 | 每日 | 90 天 | 異地儲存 |

**備份腳本**：
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# PostgreSQL 備份
pg_dump $DATABASE_URL | gzip > "${BACKUP_DIR}/db_${DATE}.sql.gz"

# 上傳到雲端儲存
aws s3 cp "${BACKUP_DIR}/db_${DATE}.sql.gz" "s3://backup-bucket/database/"

# 清理舊備份
find ${BACKUP_DIR} -type f -mtime +7 -delete

echo "Backup completed: ${DATE}"
```

**恢復流程**：
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup_file>"
  exit 1
fi

# 下載備份
aws s3 cp "s3://backup-bucket/database/${BACKUP_FILE}" /tmp/

# 恢復資料庫
gunzip -c "/tmp/${BACKUP_FILE}" | psql $DATABASE_URL

echo "Restore completed from: ${BACKUP_FILE}"
```

### 災難恢復

**RTO/RPO 目標**：

| 指標 | 目標 | 說明 |
|------|------|------|
| RPO | < 1 小時 | 可接受的最大資料遺失時間 |
| RTO | < 4 小時 | 服務恢復的最大時間 |

**災難恢復流程**：

```
災難發生
    │
    ▼
┌─────────────────┐
│  1. 評估影響    │ ─── 確認範圍與嚴重程度
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. 啟動備援    │ ─── 切換到備援環境
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. 恢復資料    │ ─── 從最近備份恢復
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. 驗證服務    │ ─── 功能與資料驗證
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. 通知用戶    │ ─── 服務恢復通知
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. 事後分析    │ ─── 根因分析與改善
└─────────────────┘
```

---

## 4. 安全與權限

### 部署安全

- 使用 GitHub Secrets 管理敏感資訊
- 部署金鑰定期輪換
- 生產環境部署需要審批
- 部署日誌完整記錄

### 存取控制

| 環境 | 部署權限 | 資料存取 |
|------|----------|----------|
| development | 開發人員 | 完全存取 |
| staging | DevOps 團隊 | 讀取權限 |
| production | 需審批 | 受限存取 |

### 安全掃描

```yaml
# security-scan.yml
security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    # 依賴漏洞掃描
    - name: Dependency Scan
      run: yarn audit --level high
    
    # 程式碼安全掃描
    - name: CodeQL Analysis
      uses: github/codeql-action/analyze@v2
    
    # 容器安全掃描 (如果使用 Docker)
    - name: Container Scan
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'gighub:${{ github.sha }}'
```

---

## 5. 測試規範

### 部署測試清單

| 測試項目 | 測試方法 | 預期結果 |
|----------|----------|----------|
| CI Pipeline | 提交程式碼 | 自動觸發建置 |
| 自動部署 | merge 到 develop | 部署到 staging |
| 回滾機制 | 部署失敗 | 自動回滾到上一版 |
| 健康檢查 | 呼叫 /health | 返回 healthy 狀態 |
| 備份恢復 | 執行恢復腳本 | 資料完整恢復 |

### 部署驗證測試

```typescript
describe('Deployment Verification', () => {
  it('health check should return healthy', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  it('database should be accessible', async () => {
    const response = await fetch(`${BASE_URL}/api/status`);
    const data = await response.json();
    
    expect(data.database).toBe('connected');
  });

  it('authentication should work', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    
    expect(response.status).toBe(200);
  });
});
```

### 災難恢復演練

| 演練項目 | 頻率 | 驗證重點 |
|----------|------|----------|
| 備份恢復 | 每月 | 資料完整性 |
| 故障切換 | 每季 | RTO 達標 |
| 全面恢復 | 每年 | 完整流程 |

---

## 6. 效能考量

### 部署效能目標

| 指標 | 目標值 | 說明 |
|------|--------|------|
| 建置時間 | < 5 分鐘 | CI 建置完成時間 |
| 部署時間 | < 10 分鐘 | 從觸發到上線 |
| 回滾時間 | < 2 分鐘 | 回滾到上一版本 |
| 零停機部署 | 是 | 滾動更新 |

### 優化策略

1. **建置優化**：
   - 使用快取加速依賴安裝
   - 平行執行測試
   - 增量建置

2. **部署優化**：
   - 滾動更新避免停機
   - 預熱新實例
   - 健康檢查確保穩定

---

## 7. 實作檢查清單

### Phase 1: CI 基礎設施
- [ ] GitHub Actions 設定
- [ ] Lint 與 Format 檢查
- [ ] Build 流程配置
- [ ] 測試自動化

### Phase 2: CD Pipeline
- [ ] Staging 自動部署
- [ ] Production 手動部署
- [ ] 回滾機制
- [ ] 部署通知

### Phase 3: 環境管理
- [ ] 環境變數配置
- [ ] Secrets 管理
- [ ] 資料庫遷移
- [ ] 環境一致性驗證

### Phase 4: 監控告警
- [ ] 健康檢查端點
- [ ] 告警規則配置
- [ ] 通知管道設定
- [ ] 值班輪值

### Phase 5: 備份恢復
- [ ] 備份腳本開發
- [ ] 備份排程設定
- [ ] 恢復流程文件
- [ ] 災難恢復演練

---

**文件版本**: v1.0
**最後更新**: 2025-11-28
**維護者**: 專案架構師
