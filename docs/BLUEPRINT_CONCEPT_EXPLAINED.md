# Blueprint 概念說明 (Blueprint Concept Explanation)

## 什麼是 Blueprint？(What is a Blueprint?)

### 簡單比喻 (Simple Analogy)

想像 Blueprint 就像一個「專案資料夾」：

```
📁 Blueprint: 住宅裝修專案
   ├── 📋 任務清單 (Task Module)
   │   ├── ✅ 水電配管
   │   ├── ⏳ 泥作工程
   │   └── 📝 油漆粉刷
   │
   ├── 📖 施工日誌 (Log Module)
   │   ├── 2025-01-15: 開始水電配管
   │   ├── 2025-01-20: 完成第一階段
   │   └── 2025-01-25: 泥作進場
   │
   └── ✓ 品質檢查 (Quality Module)
       ├── 水電檢驗單
       └── 防水測試記錄
```

### 為什麼需要 Blueprint？(Why Do We Need Blueprint?)

在工地管理系統中，一個工地專案包含很多模組：
- 任務分配與追蹤
- 施工日誌記錄
- 品質驗收檢查
- 材料與成本管理
- 人員排班
- 進度報表

**問題**: 這些模組需要共享資料和上下文，例如：
- 任務完成後要記錄到日誌
- 品質檢查要關聯到特定任務
- 進度報表要統計所有模組的資料

**解決方案**: Blueprint 提供一個「邏輯容器」，讓所有模組在同一個上下文中工作。

## Blueprint 的核心特性 (Core Features)

### 1. 擁有權 (Ownership)

Blueprint 可以被兩種實體擁有：

#### 👤 User Blueprint (個人藍圖)
```
用戶: 張先生
  └─ Blueprint: 我家裝修
      └─ 任務: 廚房改造、浴室翻新
```

**用途**: 個人或小型專案管理

#### 🏢 Organization Blueprint (組織藍圖)
```
組織: ABC 建設公司
  ├─ Blueprint: 商業大樓A棟
  │   └─ 授權給: 工程團隊、品管團隊
  │
  └─ Blueprint: 住宅社區B區
      └─ 授權給: 施工團隊
```

**用途**: 企業級專案管理

### 2. 訪問控制 (Access Control)

不同角色有不同的權限：

```
Blueprint: 商業大樓A棟 (組織擁有)
│
├─ Owner (擁有者): 張經理
│   權限: ✅ 完全控制 (建立、編輯、刪除、分配權限)
│
├─ Admin (管理員): 李工程師
│   權限: ✅ 管理 (編輯、分配權限) ❌ 不能刪除
│
├─ Editor (編輯者): 工程團隊
│   權限: ✅ 編輯內容 ❌ 不能分配權限
│
└─ Viewer (檢視者): 客戶代表
    權限: 👁️ 只能查看 ❌ 不能編輯
```

### 3. 模組共享上下文 (Shared Context)

Blueprint 內的所有模組共享同一個上下文：

```typescript
// 所有模組都知道自己在哪個 Blueprint 中
interface ModuleContext {
  blueprint_id: "uuid-123",
  blueprint_name: "商業大樓A棟",
  owner_type: "organization",
  owner_id: "org-456",
  permissions: {
    can_edit: true,
    can_delete: false
  }
}

// 任務模組使用 Blueprint 上下文
const task = {
  blueprint_id: context.blueprint_id,  // 自動關聯
  title: "水電配管",
  assigned_to: "electrician-1"
};

// 日誌模組使用相同上下文
const log = {
  blueprint_id: context.blueprint_id,  // 自動關聯
  content: "開始水電配管作業",
  timestamp: "2025-01-15"
};
```

## Team 與 Blueprint 的關係 (Team-Blueprint Relationship)

### 重要限制 ⚠️

**Team 不能建立 Blueprint！**

為什麼？因為 Blueprint 是「專案容器」，而 Team 是「工作單位」：

```
組織: ABC 建設公司 (Organization)
  │
  ├─ 建立 → Blueprint A (專案容器)
  ├─ 建立 → Blueprint B (專案容器)
  │
  └─ 建立 → 工程團隊 (Team)
       │
       └─ 授權訪問 → Blueprint A (只讀或編輯)
```

### 實際場景 (Real-World Scenario)

```
場景: ABC 建設公司有一個商業大樓專案

1. 組織管理員建立 Blueprint
   組織: ABC 建設公司
   └─ 建立: Blueprint "商業大樓A棟"

2. 組織建立多個團隊
   ├─ 工程團隊 (負責施工)
   ├─ 品管團隊 (負責檢查)
   └─ 設計團隊 (負責圖面)

3. 組織分配 Blueprint 訪問權限
   Blueprint "商業大樓A棟"
   ├─ 授權給: 工程團隊 (Editor 權限)
   ├─ 授權給: 品管團隊 (Editor 權限)
   └─ 授權給: 設計團隊 (Viewer 權限)

4. 團隊成員工作
   工程團隊成員:
   - 切換到「工程團隊」上下文
   - 在側邊欄看到「團隊藍圖」
   - 打開「商業大樓A棟」
   - 建立任務、記錄日誌 ✅
   - 但不能建立新 Blueprint ❌
```

## 使用流程範例 (Usage Flow Examples)

### 範例 1: 個人用戶使用 Blueprint

```
步驟 1: 登入系統
👤 用戶: 張先生

步驟 2: 建立個人 Blueprint
切換到「User Context」
→ 側邊欄: 我的藍圖
→ 點擊「新增藍圖」
→ 輸入: "住宅裝修專案"
→ Blueprint 建立成功 ✅

步驟 3: 在 Blueprint 中工作
進入 Blueprint "住宅裝修專案"
→ 建立任務: "水電配管"
→ 記錄日誌: "2025-01-15 開工"
→ 建立品質檢查項目
→ 所有資料自動關聯到此 Blueprint
```

### 範例 2: 組織使用 Blueprint

```
步驟 1: 組織管理員建立 Blueprint
🏢 組織: ABC 建設公司
切換到「Organization Context」
→ 側邊欄: 組織藍圖
→ 建立: "商業大樓A棟" ✅

步驟 2: 建立團隊
→ 側邊欄: 團隊管理
→ 建立: "工程團隊"
→ 加入成員: 李工程師、王技師

步驟 3: 分配權限
打開 Blueprint "商業大樓A棟"
→ 設定 → 權限管理
→ 授權給: 工程團隊 (Editor)
→ 儲存 ✅

步驟 4: 團隊成員工作
👷 團隊成員: 李工程師
切換到「Team Context」→ 工程團隊
→ 側邊欄: 團隊藍圖
→ 看到: "商業大樓A棟" ✅
→ 打開並開始工作
→ 建立任務、記錄進度
```

### 範例 3: 多團隊協作

```
組織: ABC 建設公司
  │
  └─ Blueprint: 商業大樓A棟
       │
       ├─ 工程團隊 (Editor)
       │   └─ 任務: 結構施工、水電配管
       │
       ├─ 品管團隊 (Editor)
       │   └─ 任務: 品質檢查、驗收記錄
       │
       └─ 設計團隊 (Viewer)
           └─ 只能查看進度

所有團隊在同一個 Blueprint 中工作
→ 任務互相關聯
→ 日誌統一記錄
→ 進度即時同步
```

## 常見問題 (FAQ)

### Q1: 為什麼 Team 不能建立 Blueprint？

**A**: 因為 Blueprint 代表「專案」，而 Team 代表「工作單位」。在企業結構中：
- 專案由組織規劃和建立
- 團隊負責執行專案中的工作
- 這樣可以確保專案的統一管理和控制

### Q2: 團隊成員可以在 Blueprint 中做什麼？

**A**: 根據被授予的權限：
- **Editor 權限**: 可以建立任務、記錄日誌、上傳檔案、編輯內容
- **Viewer 權限**: 只能查看，不能編輯
- **不能**: 刪除 Blueprint、修改 Blueprint 設定、分配權限

### Q3: 個人 Blueprint 和組織 Blueprint 有什麼差別？

**A**: 
| 特性 | 個人 Blueprint | 組織 Blueprint |
|------|--------------|---------------|
| 擁有者 | 用戶個人 | 組織 |
| 協作 | 可邀請其他用戶 | 可分配給團隊 |
| 規模 | 適合小型專案 | 適合大型專案 |
| 權限管理 | 簡單 | 複雜（多層級） |

### Q4: 如何在 Blueprint 之間移動或複製資料？

**A**: 這是未來擴展功能：
- Blueprint 範本系統
- 跨 Blueprint 任務連結
- Blueprint 資料匯出/匯入

### Q5: Blueprint 可以巢狀嗎？（Blueprint 裡面還有 Blueprint）

**A**: 目前設計不支援巢狀。每個 Blueprint 是獨立的容器。如果需要分層，建議：
- 使用組織建立多個 Blueprint
- 用標籤或分類管理
- 在任務層面建立跨 Blueprint 的關聯

## 技術概念對照 (Technical Concepts)

### 對於開發者 (For Developers)

```typescript
// Blueprint 就像一個 Bounded Context（限界上下文）
class BlueprintContext {
  id: string;
  name: string;
  
  // 所有模組都在此上下文中運作
  tasks: TaskModule;
  logs: LogModule;
  quality: QualityModule;
  
  // 共享的配置和狀態
  settings: BlueprintSettings;
  permissions: PermissionManager;
}

// 模組使用 Blueprint 提供的上下文
class TaskModule {
  constructor(private context: BlueprintContext) {}
  
  createTask(data: TaskData) {
    return {
      ...data,
      blueprint_id: this.context.id,  // 自動關聯
      permissions: this.context.permissions.check('task:create')
    };
  }
}
```

### 類比其他系統 (Analogies)

- **GitHub**: Blueprint = Repository，模組 = Issues/PRs/Wiki
- **Trello**: Blueprint = Board，模組 = Lists/Cards/Activities
- **JIRA**: Blueprint = Project，模組 = Issues/Sprints/Reports
- **Notion**: Blueprint = Workspace，模組 = Pages/Databases/Views

## 總結 (Summary)

Blueprint 是 GigHub 系統的核心概念：

1. ✅ **邏輯容器**: 組織多個相關模組
2. ✅ **擁有權明確**: User 或 Organization 擁有
3. ✅ **權限控制**: 細粒度的訪問控制
4. ✅ **共享上下文**: 模組之間資料互通
5. ✅ **團隊協作**: 通過權限分配實現多團隊協作

**關鍵原則**:
- User 和 Organization 可以建立 Blueprint
- Team 和 Bot 只能訪問授權的 Blueprint
- Blueprint 提供統一的專案管理容器
- 所有業務模組在 Blueprint 中共享上下文

---

**這份文件幫助您理解**: Blueprint 不是一個簡單的資料表，而是一個完整的「專案上下文容器」，它整合了多個業務模組，提供統一的訪問控制和資料共享機制。
