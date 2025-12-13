# 📋 GigHub 重構任務優先級總結

> **規劃日期**: 2025-12-13  
> **規劃方法**: Debug Workflow + Sequential Thinking + Occam's Razor  
> **總任務數**: 37 個檔案重構，分為 3 個 Phase

---

## 🎯 執行摘要

### 奧卡姆剃刀原則分析

**核心問題**：
1. 重複 = 維護成本 → Repository 有 2-3 個重複實作
2. 未使用 = 浪費資源 → 示範檔案佔用 2-3 MB
3. 孤立 = 狀態不明 → Explore/Climate 功能未整合

**最簡單解決方案**：
1. **合併重複** → 統一 Repository 介面（保留最標準的實作）
2. **移除無用** → 刪除示範檔案（風險最低，收益最大）
3. **明確狀態** → 決定孤立功能的去留（整合或移除）

---

## 🔴 Phase 1: 高優先級（立即執行 - Week 1）

### 為什麼優先執行這些任務？

1. **最低風險** - 先從簡單且安全的任務開始
2. **最大收益** - 立即減少 bundle 大小和維護成本
3. **建立信心** - 快速成功建立團隊信心

### 任務清單

| 任務 | 檔案數 | 時間 | 風險 | 收益 | 順序原因 |
|------|--------|------|------|------|----------|
| 1.1 清理示範檔案 | 12 | 15m | 🟢 極低 | 減少 2-3 MB | **最簡單**，零風險，立即見效 |
| 1.2 合併 Task Repositories | 3→1 | 4-6h | 🔴 高 | 統一維護 | 依賴最多，影響最大 |
| 1.3 合併 Log Repositories | 2→1 | 3-4h | 🔴 高 | 整合功能 | 類似 Task，經驗可複用 |

**總計**: 8-10.5 小時

### 詳細執行步驟

#### 任務 1.1: 清理示範檔案 ⭐ 建議第一個執行

**選擇理由**：
- ✅ **零風險** - 這些檔案完全未被引用
- ✅ **立即見效** - Bundle 大小立即減少 2-3 MB
- ✅ **建立信心** - 15 分鐘內完成第一個成功
- ✅ **無依賴** - 不影響任何其他任務

**執行步驟**：

```bash
# Step 1: 驗證未被引用（5 分鐘）
grep -r "demo\.(docx|pdf|pptx|xlsx)" src/
grep -r "assets/tmp/img/[1-6].png" src/

# Step 2: 備份（可選，2 分鐘）
cp -r src/assets/tmp /tmp/gighub-demo-backup

# Step 3: 刪除（3 分鐘）
rm -rf src/assets/tmp/demo.*
rm -rf src/assets/tmp/img/{1..6}.png
rm -f src/assets/tmp/avatar.jpg
touch src/assets/tmp/.gitkeep

# Step 4: 更新 .gitignore（2 分鐘）
echo "" >> .gitignore
echo "# Temporary demo assets" >> .gitignore
echo "src/assets/tmp/demo.*" >> .gitignore
echo "!src/assets/tmp/.gitkeep" >> .gitignore

# Step 5: 提交（3 分鐘）
git add -A
git commit -m "chore: 清理 ng-alain 範本示範檔案 (-2.5 MB)"
```

**驗證**：
```bash
yarn build --configuration production
# 檢查 bundle 大小減少
```

---

#### 任務 1.2: 合併 Task Repositories

**選擇理由**：
- Task 是最常用的 Repository
- 影響範圍最大，需優先統一
- 完成後可作為 Log Repository 的範本

**實施計畫**：

1. **分析差異**（1 小時）
   - 比較三個實作的差異
   - 識別獨特功能
   - 設計統一介面

2. **建立統一實作**（2 小時）
   - 整合標準 CRUD
   - 整合 Blueprint 子集合
   - 整合 Batch 操作
   - 整合 Soft delete

3. **更新測試**（1 小時）
   - 單元測試
   - 整合測試
   - 覆蓋率驗證

4. **更新引用**（30 分鐘）
   - 搜尋所有引用
   - 批次替換 import
   - 驗證編譯

5. **驗證與清理**（1-1.5 小時）
   - 執行完整測試
   - 建置驗證
   - 刪除舊檔案
   - 提交變更

**關鍵決策點**：

- ✅ **保留**: `task.repository.ts` (最標準)
- ❌ **移除**: `task-firestore.repository.ts`
- ❌ **移除**: `tasks.repository.ts` (Blueprint 內)

**Feature Flag**：

```typescript
// environment.ts
features: {
  useNewTaskRepository: false  // 預設關閉，逐步啟用
}
```

---

#### 任務 1.3: 合併 Log Repositories

**選擇理由**：
- 可複用 Task Repository 的經驗
- 額外整合照片管理功能
- 風險較低（使用頻率低於 Task）

**實施計畫**：（類似 Task Repository，3-4 小時）

---

## 🟡 Phase 2: 中優先級（短期 - Week 2-3）

### 任務清單

| 任務 | 檔案數 | 時間 | 風險 | 優先級原因 |
|------|--------|------|------|-----------|
| 2.1 整合 Firebase Services | 3→Facade | 3-4h | 🟡 中 | 統一操作入口，不破壞現有結構 |
| 2.2 處理 Explore 功能 | 1 目錄 | 1-12h | 🟡 中 | 決定功能去留，明確狀態 |
| 2.3 處理 Climate Module | 1 模組 | 2-3h | 🟡 中 | 模組完整度高，易處理 |
| 2.4 清理模組檢視元件 | 8 | 2h | 🟢 低 | 批次處理效率高 |

**總計**: 8-21 小時

### 關鍵決策

#### 2.1 Firebase Services - 使用 Facade 模式

**選擇理由**：
- ✅ **不破壞現有結構** - 保留三個服務的單一職責
- ✅ **提供統一入口** - 簡化常用操作
- ✅ **便於測試** - Facade 易於 mock

```typescript
// ✅ 新增 firebase.facade.ts（不刪除原有服務）
@Injectable({ providedIn: 'root' })
export class FirebaseFacade {
  private firebase = inject(FirebaseService);
  private auth = inject(FirebaseAuthService);
  private analytics = inject(FirebaseAnalyticsService);
  
  // 統一操作（自動記錄分析）
  async signInWithEmail(email: string, password: string) {
    const user = await this.auth.signInWithEmail(email, password);
    this.analytics.logEvent('login', { method: 'email' });
    return user;
  }
}
```

#### 2.2 Explore 功能 - 決策樹

```
Explore 功能
    │
    ├─ 是否在主路由？
    │   ├─ 是 → 保留並文件化
    │   └─ 否 → 檢查需求
    │
    └─ 是否需要？
        ├─ 是 → 整合到主路由（8-12h）
        └─ 否 → 移除或歸檔（1h）
```

**驗證方式**：

```bash
# 1. 檢查路由
grep -A 5 "explore" src/app/routes/routes.ts

# 2. 檢查引用
grep -r "ExplorePageComponent" src/
grep -r "explore-search.facade" src/

# 3. 檢查導航
grep -r "routerLink.*explore" src/
```

**決策指引**：
- 如有路由且功能完整 → **保留**
- 如有路由但功能未完成 → **決定是否完成**
- 如無路由且不需要 → **移除**

#### 2.3 Climate Module - 選用模組處理

**選擇理由**：
- 模組結構完整（有 README、services、repositories）
- 功能獨立，不影響核心
- 適合作為選用模組範例

**處理方式**：

```bash
# 移至 optional-modules
mkdir -p src/app/core/blueprint/modules/optional
mv src/app/core/blueprint/modules/implementations/climate \
   src/app/core/blueprint/modules/optional/climate

# 文件化啟用方式
```

---

## 🟢 Phase 3: 低優先級（長期 - Week 4+）

### 任務清單

| 任務 | 檔案數 | 時間 | 風險 | 優先級原因 |
|------|--------|------|------|-----------|
| 3.1 合併 Shared Modules | 3→1 | 1-2h | 🟢 低 | SHARED_IMPORTS 已統一 |
| 3.2 清理 CDK Module | 1 | 30m | 🟢 低 | 按需匯入更好 |
| 3.3 清理空測試 | 3 | 2-4h | 🟢 低 | 技術債清理 |
| 3.4 清理孤立元件 | 3 | 1h | 🟢 低 | 影響範圍小 |

**總計**: 4.5-7.5 小時

### 為什麼最後執行？

1. **影響範圍小** - 不影響核心功能
2. **可隨時執行** - 不阻礙其他任務
3. **技術債清理** - 重要但不緊急

---

## 📊 優先級決策矩陣

```
           │ 高影響 │ 中影響 │ 低影響
───────────┼────────┼────────┼────────
高緊急度   │   P1   │   P2   │   P3
───────────┼────────┼────────┼────────
中緊急度   │   P2   │   P3   │   P4
───────────┼────────┼────────┼────────
低緊急度   │   P3   │   P4   │   P5
```

### 任務映射

| 優先級 | 任務 | 原因 |
|--------|------|------|
| **P1** | 清理示範檔案 | 高緊急（影響 bundle）+ 高影響 |
| **P1** | 合併 Task Repositories | 高緊急（維護成本）+ 高影響 |
| **P1** | 合併 Log Repositories | 高緊急 + 高影響 |
| **P2** | 整合 Firebase Services | 中緊急 + 高影響 |
| **P2** | 處理 Explore 功能 | 中緊急 + 中影響 |
| **P3** | 處理 Climate Module | 中緊急 + 中影響 |
| **P3** | 清理模組檢視元件 | 中緊急 + 低影響 |
| **P4** | 合併 Shared Modules | 低緊急 + 中影響 |
| **P5** | 其他清理 | 低緊急 + 低影響 |

---

## 🎯 依賴關係圖

```
Phase 1
┌─────────────────────────┐
│ 1.1 清理示範檔案        │ ← 獨立，可立即執行
└─────────────────────────┘

┌─────────────────────────┐
│ 1.2 合併 Task Repos     │ ← 獨立，但建議在 1.1 後
└─────────────────────────┘
            ↓
┌─────────────────────────┐
│ 1.3 合併 Log Repos      │ ← 可複用 Task 經驗
└─────────────────────────┘

Phase 2
┌─────────────────────────┐
│ 2.1 Firebase Facade     │ ← 獨立
└─────────────────────────┘

┌─────────────────────────┐
│ 2.2 Explore 功能        │ ← 獨立
└─────────────────────────┘

┌─────────────────────────┐
│ 2.3 Climate Module      │ ← 獨立
└─────────────────────────┘

┌─────────────────────────┐
│ 2.4 清理模組檢視        │ ← 獨立
└─────────────────────────┘

Phase 3
┌─────────────────────────┐
│ 3.1-3.4 其他清理        │ ← 可並行
└─────────────────────────┘
```

**關鍵發現**：大部分任務相互獨立，可並行處理！

---

## ⏱️ 時間規劃

### 單人執行（循序）

| 週次 | Phase | 任務 | 時間 |
|------|-------|------|------|
| Week 1 | Phase 1 | 1.1, 1.2, 1.3 | 8-10.5h |
| Week 2 | Phase 2 | 2.1, 2.2 | 4-16h |
| Week 3 | Phase 2 | 2.3, 2.4 | 4-5h |
| Week 4 | Phase 3 | 3.1-3.4 | 4.5-7.5h |

**總計**: 20.5-39 小時 (3-5 天)

### 雙人並行（推薦）

| 週次 | Person A | Person B | 總時間 |
|------|----------|----------|--------|
| Week 1 | 1.1 + 1.2 | 1.3 | ~6h |
| Week 2 | 2.1 + 2.3 | 2.2 | ~10h |
| Week 3 | 2.4 | 3.1-3.4 | ~4h |

**總計**: ~20 小時 (2.5 天)

---

## ✅ 里程碑檢查點

### Milestone 1: Phase 1 完成

**目標日期**: Week 1 結束  
**檢查項目**:
- [ ] 示範檔案已移除，bundle 減少 2-3 MB
- [ ] Task Repository 已合併，測試通過
- [ ] Log Repository 已合併，測試通過
- [ ] 所有 Lint 檢查通過
- [ ] 建置成功

**成功指標**:
- 程式碼重複率下降 > 50%
- 測試覆蓋率 ≥ 80%
- 無新增錯誤

### Milestone 2: Phase 2 完成

**目標日期**: Week 2-3 結束  
**檢查項目**:
- [ ] Firebase Facade 已建立
- [ ] Explore/Climate 功能狀態明確
- [ ] 未使用元件已清理
- [ ] 文檔已更新

**成功指標**:
- 架構清晰度提升
- 孤立功能 = 0
- 維護文檔完整

### Milestone 3: Phase 3 完成

**目標日期**: Week 4 結束  
**檢查項目**:
- [ ] Shared Modules 已統一
- [ ] 所有技術債已清理
- [ ] 最終驗證通過

**成功指標**:
- 技術債評分 ≥ A
- 所有目標達成

---

## 🚀 快速開始（First Day）

### 第一天計畫（4 小時）

```bash
# 09:00-09:30: 準備環境
git checkout -b refactor/architecture-cleanup
yarn install
yarn test  # 確保基準通過

# 09:30-09:45: 任務 1.1 - 清理示範檔案（15分鐘）
# 執行前面描述的步驟
rm -rf src/assets/tmp/demo.*
# ... 其他清理
git commit -m "chore: 清理示範檔案"

# 09:45-10:00: 驗證與慶祝 🎉
yarn build
# 確認 bundle 減少

# 10:00-12:00: 任務 1.2 開始 - 分析 Task Repository
# 比較三個實作
diff src/app/core/repositories/task*.ts
# 設計統一介面

# 12:00-13:00: 午休

# 13:00-15:00: 任務 1.2 繼續 - 實作統一 Repository
# 撰寫新的 TaskRepository
# 整合所有功能

# 15:00-16:00: 任務 1.2 繼續 - 測試
# 撰寫/更新測試
yarn test task.repository

# 16:00-17:00: Code Review 準備
# 整理變更
# 撰寫 PR 描述
```

**預期產出**：
- ✅ 示範檔案已清理
- ⏳ Task Repository 統一實作完成 50%

---

## 📚 相關文件

1. **完整實施計畫**: `REFACTORING_IMPLEMENTATION_PLAN.md`
2. **風險評估**: `RISK_ASSESSMENT.md`
3. **架構分析**: `../ARCHITECTURE_ANALYSIS.md`
4. **快速參考**: `../REFACTORING_SUMMARY.zh-TW.md`

---

## 🎯 關鍵成功因素

1. **從簡單開始** - 先執行零風險任務建立信心
2. **Feature Flag** - 所有高風險變更使用 Feature Flag
3. **完整測試** - 測試覆蓋率 ≥ 80%
4. **小步快跑** - 頻繁提交，快速驗證
5. **文檔同步** - 重構完成時同步更新文檔

---

**文件版本**: v1.0  
**建立日期**: 2025-12-13  
**建議審查**: 每週更新進度
