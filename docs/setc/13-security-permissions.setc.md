# 13-security-permissions.setc.md

## 1. 模組概述

### 業務價值
安全與權限設計確保系統的安全性與合規性：
- **資料保護**：防止未授權存取
- **權限控制**：精細的角色權限管理
- **安全防護**：防範常見攻擊
- **合規稽核**：操作記錄與追蹤

### 核心功能
1. **RLS 設計原則**：行級安全的設計與實作
2. **權限檢查流程**：多層權限驗證機制
3. **XSS/SQL Injection 防護**：前端與後端安全措施
4. **Storage RLS Policy**：檔案存取控制
5. **稽核機制**：操作記錄與追蹤

### 在系統中的定位
安全與權限是橫切所有層級的關注點，確保系統從資料層到應用層的完整保護。

---

## 2. 功能需求

### 安全需求清單

#### SEC-001: 認證安全
**需求**：確保用戶身份認證的安全性

**驗收標準**：
- [ ] 使用 Supabase Auth 進行身份認證
- [ ] 支援 Email/Password 登入
- [ ] 支援 OAuth 社交登入
- [ ] 實作 MFA（多因素認證）
- [ ] JWT Token 有效期管理

#### SEC-002: 授權控制
**需求**：實現精細的權限控制

**驗收標準**：
- [ ] 平台角色：Super Admin, User
- [ ] 組織角色：Owner, Admin, Member
- [ ] 藍圖角色：Owner, Admin, Member, Viewer
- [ ] 支援自訂角色與權限

#### SEC-003: 資料隔離
**需求**：確保多租戶資料隔離

**驗收標準**：
- [ ] 所有資料表啟用 RLS
- [ ] 藍圖資料按 blueprint_id 隔離
- [ ] Storage 檔案按路徑隔離
- [ ] 防止跨租戶資料存取

#### SEC-004: 輸入驗證
**需求**：防止惡意輸入攻擊

**驗收標準**：
- [ ] 所有 API 輸入進行驗證
- [ ] 防止 SQL Injection
- [ ] 防止 XSS 攻擊
- [ ] 檔案上傳類型限制

#### SEC-005: 稽核記錄
**需求**：記錄所有重要操作

**驗收標準**：
- [ ] 登入/登出記錄
- [ ] 資料變更記錄
- [ ] 權限變更記錄
- [ ] 存取異常記錄

---

## 3. 技術設計

### 權限架構

```
平台層級
├── Super Admin（系統管理員）
│   └── 全域管理權限
└── User（一般用戶）
    └── 基本使用權限

組織層級
├── Organization Owner（組織擁有者）
│   └── 組織完整控制權
├── Organization Admin（組織管理員）
│   └── 成員管理、設定管理
└── Organization Member（組織成員）
    └── 參與協作

藍圖層級
├── Blueprint Owner（藍圖擁有者）
│   └── 藍圖完整控制權
├── Blueprint Admin（藍圖管理員）
│   └── 內容管理、成員管理
├── Blueprint Member（藍圖成員）
│   └── 內容編輯
└── Blueprint Viewer（藍圖檢視者）
    └── 僅供檢視
```

### 權限矩陣

| 操作 | Owner | Admin | Member | Viewer |
|------|-------|-------|--------|--------|
| 檢視藍圖 | ✓ | ✓ | ✓ | ✓ |
| 建立任務 | ✓ | ✓ | ✓ | ✗ |
| 編輯任務 | ✓ | ✓ | ✓* | ✗ |
| 刪除任務 | ✓ | ✓ | ✗ | ✗ |
| 管理成員 | ✓ | ✓ | ✗ | ✗ |
| 藍圖設定 | ✓ | ✓ | ✗ | ✗ |
| 刪除藍圖 | ✓ | ✗ | ✗ | ✗ |

*Member 只能編輯自己建立或指派的任務

### RLS 設計原則

**核心原則**：
1. **預設拒絕**：未明確授權的操作一律拒絕
2. **最小權限**：只授予必要的權限
3. **避免遞迴**：RLS 中不查詢受保護的同一表
4. **效能優先**：RLS 條件需有索引支援

**Helper Functions**：
```sql
-- 安全的權限檢查函數（SECURITY DEFINER）
CREATE OR REPLACE FUNCTION is_blueprint_member(p_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- 以定義者權限執行，避免 RLS 遞迴
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blueprint_members
    WHERE blueprint_id = p_blueprint_id
    AND account_id = auth.uid()
  );
END;
$$;

-- 取得用戶角色（避免重複查詢）
CREATE OR REPLACE FUNCTION get_user_role_in_blueprint(p_blueprint_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT role FROM blueprint_members
    WHERE blueprint_id = p_blueprint_id
    AND account_id = auth.uid()
  );
END;
$$;
```

### 權限檢查流程

```
請求進入
    │
    ▼
┌───────────────────┐
│  1. 認證檢查      │ ─── JWT Token 驗證
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  2. API 層權限    │ ─── Middleware / Guard
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  3. 業務層權限    │ ─── Service 內檢查
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  4. RLS 強制執行  │ ─── 資料庫層最終防線
└─────────┬─────────┘
          │
          ▼
     資料返回
```

### XSS 防護

**Angular 內建防護**：
```typescript
// ✓ 安全：Angular 自動轉義
@Component({
  template: `<div>{{ userContent }}</div>`
})
class MyComponent {
  userContent = '<script>alert("xss")</script>';
  // 渲染結果：&lt;script&gt;alert("xss")&lt;/script&gt;
}

// ✗ 危險：繞過安全檢查
@Component({
  template: `<div [innerHTML]="unsafeContent"></div>`
})
class UnsafeComponent {
  unsafeContent = this.sanitizer.bypassSecurityTrustHtml(userInput);
  // 只有確認安全的內容才能使用 bypassSecurityTrustHtml
}

// ✓ 安全：使用 sanitize
@Component({
  template: `<div [innerHTML]="safeContent"></div>`
})
class SafeComponent {
  safeContent = this.sanitizer.sanitize(SecurityContext.HTML, userInput);
}
```

### SQL Injection 防護

**Repository 層防護**：
```typescript
// ✗ 危險：字串拼接
async findByName(name: string) {
  const query = `SELECT * FROM tasks WHERE name = '${name}'`;
  // SQL Injection 風險！
}

// ✓ 安全：使用 Supabase 客戶端
async findByName(name: string) {
  const { data } = await this.supabase.client
    .from('tasks')
    .select('*')
    .eq('name', name);  // Supabase 自動參數化
  return data;
}

// ✓ 安全：RPC 呼叫
async customQuery(params: QueryParams) {
  const { data } = await this.supabase.client
    .rpc('custom_function', params);  // 參數自動處理
  return data;
}
```

### Storage RLS Policy

```sql
-- 藍圖檔案存取控制
CREATE POLICY "blueprint_file_access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'blueprints'
  AND is_blueprint_member(
    (storage.foldername(name))[1]::uuid  -- 從路徑提取 blueprint_id
  )
);

-- 個人檔案存取控制
CREATE POLICY "user_file_access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'users'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 檔案上傳安全

```typescript
// 允許的檔案類型
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// 禁止的副檔名
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com',
  '.vbs', '.ps1',
  '.dll', '.sys'
];

// 檔案大小限制
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,      // 10 MB
  document: 50 * 1024 * 1024,   // 50 MB
  cad: 100 * 1024 * 1024        // 100 MB
};

// 驗證函數
function validateFile(file: File): ValidationResult {
  // 檢查 MIME 類型
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: '不支援的檔案類型' };
  }
  
  // 檢查副檔名
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (ext && BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: '禁止的檔案類型' };
  }
  
  // 檢查檔案大小
  const category = getFileCategory(file.type);
  if (file.size > MAX_FILE_SIZES[category]) {
    return { valid: false, error: '檔案大小超過限制' };
  }
  
  return { valid: true };
}
```

### 稽核記錄設計

```sql
-- 稽核記錄表
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES accounts(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 稽核觸發器
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    actor_id, action, entity_type, entity_id,
    old_values, new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. 安全與權限

### 安全檢查清單

#### 認證安全
- [ ] JWT Token 過期時間設定（建議 1 小時）
- [ ] Refresh Token 機制
- [ ] 登入失敗次數限制
- [ ] 密碼強度要求
- [ ] 安全標頭設定（CSP, HSTS）

#### 授權安全
- [ ] 所有 API 端點權限檢查
- [ ] RLS 政策完整性
- [ ] 預設拒絕原則
- [ ] 角色權限最小化

#### 資料安全
- [ ] 敏感資料加密儲存
- [ ] 傳輸層加密（HTTPS）
- [ ] 日誌脫敏處理
- [ ] 備份加密

---

## 5. 測試規範

### 安全測試清單

```typescript
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should_rejectExpiredToken');
    it('should_rejectInvalidToken');
    it('should_lockAccount_afterMultipleFailedLogins');
  });
  
  describe('Authorization', () => {
    it('viewer_shouldNot_createTask');
    it('member_shouldNot_deleteOthersTask');
    it('admin_should_manageMembers');
  });
  
  describe('RLS', () => {
    it('nonMember_shouldNot_accessBlueprint');
    it('member_should_accessOwnBlueprint');
    it('crossTenant_shouldBe_isolated');
  });
  
  describe('Input Validation', () => {
    it('should_preventSqlInjection');
    it('should_sanitizeHtmlInput');
    it('should_rejectMaliciousFiles');
  });
});
```

### 滲透測試案例

1. **SQL Injection 測試**：`' OR '1'='1`
2. **XSS 測試**：`<script>alert('xss')</script>`
3. **CSRF 測試**：跨站請求偽造
4. **權限提升測試**：嘗試存取未授權資源

---

## 6. 效能考量

### 權限檢查效能

| 檢查類型 | 目標時間 |
|----------|----------|
| JWT 驗證 | < 5ms |
| RLS 檢查 | < 10ms |
| 權限查詢 | < 20ms |

### 優化策略

1. **快取權限**：快取用戶角色與權限
2. **批次檢查**：批量操作時合併權限檢查
3. **索引優化**：RLS 條件欄位建立索引
4. **連線池**：複用資料庫連線

---

## 7. 實作檢查清單

### 認證
- [ ] Supabase Auth 配置
- [ ] Email/Password 設定
- [ ] OAuth 設定
- [ ] MFA 設定
- [ ] Token 管理

### RLS
- [ ] 所有資料表啟用 RLS
- [ ] Helper Functions 建立
- [ ] RLS 政策建立
- [ ] RLS 政策測試

### 防護
- [ ] XSS 防護措施
- [ ] SQL Injection 防護
- [ ] CSRF 防護
- [ ] 檔案上傳驗證
- [ ] 安全標頭設定

### 稽核
- [ ] 稽核記錄表建立
- [ ] 稽核觸發器設定
- [ ] 稽核查詢 API
- [ ] 日誌保留政策

### 測試
- [ ] 認證測試
- [ ] 授權測試
- [ ] RLS 測試
- [ ] 滲透測試

---

**文件版本**: v1.0
**最後更新**: 2025-11-28
**維護者**: 專案架構師
