# 故障排除指南

> 常見問題的診斷與解決方案

---

## 📋 文檔索引

| 文檔 | 說明 | 關鍵詞 |
|------|------|--------|
| [PostgreSQL 42501 錯誤分析](./postgresql-42501-analysis.md) | 42501 錯誤的根本原因與解決方案 | RLS, 權限, insufficient_privilege |
| [RLS 最佳實踐](./rls-best-practices.md) | 預防 RLS 相關錯誤的最佳實踐 | SECURITY DEFINER, Helper Functions |

---

## 🔧 快速診斷

### PostgreSQL 錯誤代碼

| 錯誤代碼 | 名稱 | 常見原因 |
|---------|------|---------|
| `42501` | insufficient_privilege | RLS 策略拒絕操作 |
| `42P01` | undefined_table | 表不存在 |
| `23503` | foreign_key_violation | 外鍵約束違反 |
| `23505` | unique_violation | 唯一約束違反 |

### 快速檢查命令

```sql
-- 檢查用戶身份
SELECT 
  auth.uid() as auth_user_id,
  public.get_user_account_id() as account_id;

-- 檢查表的 RLS 策略
SELECT * FROM pg_policies WHERE tablename = '<table_name>';

-- 檢查 RLS 是否啟用
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = '<table_name>';
```

---

## 📚 相關資源

- [Supabase 整合指南](../supabase/README.md)
- [RLS 政策驗證工作流程](../../.github/copilot/workflows/rls-check.workflow.md)

---

**最後更新**: 2025-11-29
