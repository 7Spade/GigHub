# GitHub Copilot Agent MCP 工具使用指南

> **目的**: 幫助開發者最大化 GitHub Copilot Agent (web) 對 MCP 工具的使用效果

---

## 📋 已配置的 MCP 工具

### 核心工具 (已在 GitHub 設定中配置)

| 工具 | 用途 | 強制性 | 配置狀態 |
|------|------|--------|---------|
| **context7** | 查詢最新框架文檔 | 🔴 必須 | ✅ 已配置 |
| **sequential-thinking** | 結構化推理與分析 | 🟡 必須 | ✅ 已配置 |
| **software-planning-tool** | 功能規劃與任務管理 | 🟢 必須 | ✅ 已配置 |
| **memory** | 專案知識記憶 | 🔵 自動 | ✅ 已配置 |
| **github** | GitHub API 操作 | 🔵 自動 | ✅ 已配置 |
| **supabase** | Supabase 操作 | 🔵 自動 | ✅ 已配置 |
| **filesystem** | 檔案系統操作 | 🔵 自動 | ✅ 已配置 |
| **time** | 時間相關操作 | 🔵 自動 | ✅ 已配置 |
| **everything** | 通用工具集 | 🔵 自動 | ✅ 已配置 |

---

## 🎯 如何確保 Copilot 使用工具

### 方法 1: 使用明確的觸發詞 (推薦) ⭐

#### Context7 觸發範例
```
❌ 不佳: "如何使用 Angular Signals?"
✅ 良好: "使用 context7 查詢 Angular 20 Signals 的最新用法"
✅ 良好: "請先用 context7 確認 ng-zorro-antd 20.3 的 ST 表格 API"
```

#### Sequential-Thinking 觸發範例
```
❌ 不佳: "設計一個任務模組"
✅ 良好: "使用 sequential-thinking 分析並設計任務管理模組的架構"
✅ 良好: "請用 sequential-thinking 推理這個 Bug 的可能原因"
```

#### Software-Planning-Tool 觸發範例
```
❌ 不佳: "要做一個通知功能"
✅ 良好: "使用 software-planning-tool 規劃通知系統的開發任務"
✅ 良好: "請用 software-planning-tool 建立付款模組的實作計畫"
```

### 方法 2: 在對話開頭聲明

每次新對話時加上：
```
請嚴格遵循 .github/copilot-instructions.md 中的 MANDATORY 工具使用政策。
對於所有框架/函式庫問題必須使用 context7。
```

### 方法 3: 使用預定義的 Chat 快捷指令

已配置的快捷指令 (在 `.github/copilot/shortcuts/chat-shortcuts.md`):

```
/gighub-component    # 生成符合 GigHub 規範的元件
/gighub-service      # 生成符合 GigHub 規範的服務  
/gighub-repository   # 生成 Supabase Repository
/gighub-store        # 生成 Signal-based Store
/gighub-review       # 審查程式碼是否符合規範
/gighub-refactor     # 重構為現代 Angular 語法
```

---

## 🧠 Memory 工具使用指南

### Memory 檔案說明

**`.github/copilot/memory.jsonl`** (121KB, 50 entities)
- Copilot Agent 的主要記憶儲存
- 包含專案架構、模式、最佳實踐等知識
- 格式: JSONL (每行一個 JSON 物件)

**`.github/copilot/store_memory.jsonl`** (829 bytes, 1 entry)
- 手動儲存的額外記憶
- 可合併到 memory.jsonl

### 如何新增專案知識到 Memory

#### 手動新增 (推薦用於關鍵資訊)

在 `memory.jsonl` 結尾添加新行：
```json
{"type": "entity", "name": "Payment Request Critical Schema", "entityType": "Database", "observations": ["payment_requests 表使用 amount 欄位 (非 requested_amount)", "payments 表使用 amount 和 payment_date 欄位", "兩表皆使用 lifecycle enum 而非獨立 status", "metadata 欄位儲存額外資訊如 approver_id, requester_id"]}
```

#### 透過 Copilot 自動記錄

當您告訴 Copilot 重要資訊時，要求它記錄：
```
"請將這個關於 payment schema 的重要發現記錄到 memory"
```

### Memory 最佳實踐

**✅ 應該記錄**:
- 關鍵架構決策
- 常見錯誤與解決方案
- 資料庫 schema 特殊設計
- 效能優化經驗
- 團隊共識的模式

**❌ 不應記錄**:
- 一次性的臨時資訊
- 會快速變更的配置
- 過於細節的實作
- 重複已有的資訊

**🔄 定期維護**:
```bash
# 每月檢查一次
# 1. 移除過時資訊
# 2. 合併重複條目  
# 3. 更新變更的模式
# 4. 保持 50-100 個高品質 entities
```

---

## 🔍 驗證工具使用效果

### 測試 Context7

**測試問題**:
```
"請使用 context7 查詢 Angular 20 中 input() 函數的完整用法和範例"
```

**預期回應**:
1. Copilot 會呼叫 `resolve-library-id` 找到 Angular 文檔
2. 呼叫 `get-library-docs` 取得最新資訊
3. 提供準確的 Angular 20 語法和範例

**驗證要點**:
- ✅ 語法是否是 Angular 19+ 的新語法
- ✅ 是否提到 `input()` 而非 `@Input()`
- ✅ 範例是否使用 Signals

### 測試 Sequential-Thinking

**測試問題**:
```
"使用 sequential-thinking 分析：如何設計一個支援多組織協作的任務分派系統？"
```

**預期回應**:
1. 步驟 1: 分析需求與限制
2. 步驟 2: 識別關鍵實體與關係
3. 步驟 3: 設計資料模型
4. 步驟 4: 規劃 API 介面
5. 步驟 5: 考量權限與安全
6. 結論與建議

**驗證要點**:
- ✅ 是否有清晰的步驟編號
- ✅ 每步是否有詳細推理
- ✅ 是否考量 GigHub 專案的架構

### 測試 Software-Planning-Tool

**測試問題**:
```
"使用 software-planning-tool 為「通知系統」建立開發計畫"
```

**預期回應**:
1. 目標定義
2. 任務分解 (Types → Repositories → Services → Components)
3. 每個任務的檢查清單
4. 預估時間與優先級
5. 風險識別

**驗證要點**:
- ✅ 任務是否遵循 GigHub 的五層架構
- ✅ 是否有明確的檢查清單
- ✅ 任務順序是否符合依賴關係

### 測試 Memory

**測試問題**:
```
"專案使用的架構模式是什麼？有哪些關鍵的設計決策？"
```

**預期回應**:
- 提到「Five Layer Architecture」或「Hybrid Architecture Model」
- 提到「Git-like Branch Model」
- 引用 memory.jsonl 中的具體 observations

**驗證要點**:
- ✅ 是否準確引用專案的架構資訊
- ✅ 是否提到 memory.jsonl 中已記錄的模式
- ✅ 資訊是否與實際專案一致

---

## 📊 工具使用效果對照

### 優化前 vs 優化後

| 場景 | 優化前 | 優化後 |
|------|--------|--------|
| 詢問 Angular API | 可能給出過時語法 | ✅ 使用 context7 查詢最新文檔 |
| 複雜問題分析 | 直接給答案，推理不清 | ✅ 使用 sequential-thinking 結構化分析 |
| 新功能開發 | 籠統建議 | ✅ 使用 software-planning-tool 詳細規劃 |
| 專案知識查詢 | 無法記住專案特性 | ✅ 從 memory.jsonl 讀取專案知識 |
| 程式碼生成 | 可能不符規範 | ✅ 遵循 copilot-instructions.md 規範 |

### 預期改善指標

```
Context7 使用率: 30% → 80% (+166%)
程式碼準確度: 70% → 90% (+28%)
架構一致性: 60% → 95% (+58%)
開發效率: 基準 → +20-30%
```

---

## 🔐 GitHub Actions 變數與 Secrets 配置（存取環境變數）

- 依照 [GitHub 官方說明](https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/write-workflows/choose-what-workflows-do/use-variables#creating-configuration-variables-for-a-repository) 在 **Settings → Secrets and variables → Actions → Variables → New variable** 建立「設定變數」。機密值請改存 **Secrets**（值會被遮罩，Agent 無法直接讀取）。
- 若需要環境審核或不同環境值，改存到 Environment scope 並設定 Required reviewers，再在 workflow 中以 `vars.<NAME>`（變數）或 `secrets.<NAME>`（秘密）取用。
- Copilot Agent 無法直接查看變數/Secrets，本質上只能在 workflow 中被引用後使用；請避免把 Secrets 直接 `echo` 到日誌。

```yaml
name: use-vars-example
on: workflow_dispatch

jobs:
  demo:
    runs-on: ubuntu-latest
    env:
      PUBLIC_CONFIG: ${{ vars.PUBLIC_CONFIG }}   # 非機密設定
    steps:
      - name: Show non-secret variable
        run: echo "$PUBLIC_CONFIG"

      - name: Use secret without printing
        run: some-cli --token "$MY_TOKEN"
        env:
          MY_TOKEN: ${{ secrets.MY_TOKEN }}
```

> 原則：能用變數就不要存 Secrets；若必須用 Secrets，僅在需要的步驟中以 env 引用並遵守最小權限。

---

## 🚨 常見問題排解

### Q1: Copilot 沒有使用 context7

**可能原因**:
- 問題表述不夠明確
- 未提及需要查詢文檔

**解決方法**:
```
明確要求: "請使用 context7 查詢..."
或在對話開頭: "請遵循 MANDATORY 工具使用政策"
```

### Q2: Memory 資訊沒有被引用

**可能原因**:
- 問題與 memory 中的資訊關聯性不強
- Memory 條目過於分散

**解決方法**:
```
明確詢問: "根據專案 memory，架構模式是什麼？"
或整理 memory: 將相關條目合併，增強關聯性
```

### Q3: Sequential-thinking 沒有被觸發

**可能原因**:
- 問題看起來不夠複雜
- 未明確要求使用

**解決方法**:
```
明確要求: "使用 sequential-thinking 分析..."
或加上: "請進行結構化推理"
```

### Q4: Store_memory 失敗

**根本原因**:
- GitHub Copilot Agent (web) 環境限制
- 可能缺少寫入權限

**建議做法**:
```bash
# 手動合併到 memory.jsonl
cat .github/copilot/store_memory.jsonl >> .github/copilot/memory.jsonl

# 清空 store_memory.jsonl
> .github/copilot/store_memory.jsonl
```

---

## 🎯 最佳實踐建議

### 1. 養成明確提問習慣

**不佳範例**:
```
"如何做權限檢查?"
```

**良好範例**:
```
"使用 context7 查詢 @delon/acl 的最新用法，並根據 GigHub 專案的 memory 中的權限模式，說明如何實作權限檢查"
```

### 2. 善用快捷指令

不需要每次都手動輸入完整提示詞：
```
/gighub-component    # 自動套用所有規範
/gighub-review       # 自動檢查規範遵循度
```

### 3. 定期更新 Memory

每完成重要功能後：
```
"請將這次開發中發現的關鍵模式和決策記錄到 memory"
```

### 4. 驗證工具使用

偶爾測試 Copilot 是否真的在用工具：
```
"請展示你使用 context7 查詢的過程"
```

### 5. 提供回饋

如果發現 Copilot 沒有按預期使用工具：
```
"請嚴格遵循 copilot-instructions.md 中的 MANDATORY 政策，重新回答這個問題"
```

---

## 📚 相關文檔

- `.github/copilot-instructions.md` - Copilot 主配置 (含 MANDATORY 政策)
- `.github/instructions/quick-reference.instructions.md` - 快速參考
- `.github/copilot/shortcuts/chat-shortcuts.md` - Chat 快捷指令
- `.github/copilot/constraints.md` - 約束規則
- `.github/copilot/memory.jsonl` - 專案知識庫
- `.github/copilot/security-rules.yml` - 安全規則配置

---

## 🔄 持續改進

### 每週檢查
- [ ] Context7 使用率是否提升
- [ ] 生成的程式碼是否更符合規範
- [ ] Memory 是否有新增有價值的知識

### 每月維護
- [ ] 整理 memory.jsonl (移除過時、合併重複)
- [ ] 更新 copilot-instructions.md (新增發現的模式)
- [ ] 檢討工具使用效果並調整策略

---

**最後更新**: 2025-12-10  
**維護者**: GitHub Copilot  
**反饋**: 發現問題請在 PR 中評論
