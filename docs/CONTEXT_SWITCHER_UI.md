# 上下文切換器 UI 參考 (Context Switcher UI Reference)

## 位置 (Location)
上下文切換器出現在**左側邊欄使用者選單下拉列表**中，當您點擊使用者頭像時顯示。

## 視覺結構 (Visual Structure)

```
┌─────────────────────────────────────────┐
│  User Avatar & Info (Click to Open)     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 🔄 切換工作區                           │ ← Header (non-clickable)
├─────────────────────────────────────────┤
│ 👤 個人帳戶                             │ ← User Context (selected by default)
│ 👥 示範組織 A ▶                        │ ← Organization (expandable)
│    👥 示範組織 A                        │   ← Org itself
│    👥 開發團隊                          │   ← Team 1
│    👥 設計團隊                          │   ← Team 2
│ 👥 示範組織 B ▶                        │ ← Organization (expandable)
│    👥 示範組織 B                        │   ← Org itself
│    👥 營運團隊                          │   ← Team 3
│ 🤖 自動化機器人                        │ ← Bot Context
├─────────────────────────────────────────┤
│ 👤 個人中心                             │ ← Account Center
│ ⚙️  個人設置                            │ ← Account Settings
└─────────────────────────────────────────┘
```

## 圖標參考 (Icons Reference)

| 上下文類型 (Context Type) | 圖標 (Icon)        | 描述 (Description)           |
|---------------------------|-------------------|------------------------------|
| User (使用者)              | `user`            | Personal account (個人帳戶)   |
| Organization (組織)        | `team`            | Organization context (組織上下文) |
| Team (團隊)                | `usergroup-add`   | Team within org (組織內團隊)  |
| Bot (機器人)               | `robot`           | Automated bot account (自動化機器人帳戶) |

## 互動行為 (Interaction Behavior)

1. **點擊使用者頭像 (Click on User Avatar)** → 開啟下拉選單
2. **點擊個人帳戶 (Click on Personal Account)** → 切換到使用者上下文
3. **懸停在組織上 (Hover on Organization)** → 顯示展開箭頭
4. **點擊組織名稱 (Click on Organization Name)** → 展開顯示團隊並切換到組織上下文
5. **點擊團隊名稱 (Click on Team Name)** → 切換到團隊上下文
6. **點擊機器人名稱 (Click on Bot Name)** → 切換到機器人上下文
7. **選定的上下文 (Selected Context)** → 使用 `ant-menu-item-selected` 類別高亮顯示

## 狀態指示器 (State Indicators)

### 選定的上下文（高亮）(Selected Context - Highlighted)
當前選定的上下文通過以下方式視覺高亮顯示：
- 背景顏色變更（Ant Design 的選定樣式）
- 勾選圖標（可選，取決於主題）

### 當前上下文顯示 (Current Context Display)
當前上下文標籤也顯示在：
- Service: `workspaceContext.contextLabel()`
- Service: `workspaceContext.contextIcon()`

可在應用程式的其他地方用於顯示：
```
Currently working in: 👥 示範組織 A
```

## 模擬資料結構 (Mock Data Structure)

```typescript
{
  user: {
    id: '<firebase-uid>',
    name: '<from Firebase Auth displayName>',
    email: '<from Firebase Auth email>'
  },
  
  organizations: [
    { id: 'org-1', name: '示範組織 A' },
    { id: 'org-2', name: '示範組織 B' }
  ],
  
  teams: [
    { id: 'team-1', organization_id: 'org-1', name: '開發團隊' },
    { id: 'team-2', organization_id: 'org-1', name: '設計團隊' },
    { id: 'team-3', organization_id: 'org-2', name: '營運團隊' }
  ],
  
  bots: [
    { id: 'bot-1', name: '自動化機器人', owner_id: '<user-id>' }
  ]
}
```

## 持久化 (Persistence)

上下文選擇**自動保存**到 localStorage，鍵為 `'workspace_context'`：

```json
{
  "type": "organization",
  "id": "org-1"
}
```

在頁面重新載入時，服務自動：
1. 載入保存的上下文
2. 恢復選擇
3. 更新 UI 以顯示選定的上下文

## 整合點 (Integration Points)

### 在您的元件中檢查當前上下文 (To Check Current Context in Your Components)

```typescript
import { inject } from '@angular/core';
import { WorkspaceContextService } from '@shared';

@Component({...})
export class MyComponent {
  private readonly workspaceContext = inject(WorkspaceContextService);
  
  // 獲取當前上下文類型
  contextType = this.workspaceContext.contextType;  // Signal<ContextType>
  
  // 獲取當前上下文 ID
  contextId = this.workspaceContext.contextId;  // Signal<string | null>
  
  // 獲取顯示標籤
  contextLabel = this.workspaceContext.contextLabel;  // Signal<string>
  
  // 獲取圖標名稱
  contextIcon = this.workspaceContext.contextIcon;  // Signal<string>
  
  // 檢查是否為使用者上下文
  get isUserContext(): boolean {
    return this.contextType() === ContextType.USER;
  }
}
```

### 根據上下文過濾資料 (To Filter Data by Context)

```typescript
// 在您的資料服務中
async getBlueprints() {
  const contextType = this.workspaceContext.contextType();
  const contextId = this.workspaceContext.contextId();
  
  switch (contextType) {
    case ContextType.ORGANIZATION:
      return this.firestore
        .collection('blueprints')
        .where('organization_id', '==', contextId)
        .get();
    
    case ContextType.TEAM:
      return this.firestore
        .collection('blueprints')
        .where('team_id', '==', contextId)
        .get();
    
    case ContextType.USER:
    default:
      return this.firestore
        .collection('blueprints')
        .where('user_id', '==', contextId)
        .get();
  }
}
```

## 響應式行為 (Responsive Behavior)

- **桌面 (Desktop)**: 完整選單，包含圖標和文字
- **行動裝置 (Mobile)**: 相同行為（側邊欄抽屜的一部分）
- **觸控 (Touch)**: 點擊以展開組織
- **鍵盤 (Keyboard)**: 支援方向鍵導航（ng-zorro-antd 原生行為）

## 樣式 (Styling)

元件使用：
- Ant Design 的選單元件類別
- ng-zorro-antd 的內建樣式
- 巢狀項目的自訂內距
- 響應式間距

顏色繼承自主題：
- 選定 (Selected): 主色背景
- 懸停 (Hover): 較淺的主色
- 活躍 (Active): 較深的主色
- 停用 (Disabled): 灰色文字

## 無障礙 (Accessibility)

- **ARIA 標籤 (ARIA Labels)**: 繼承自 ng-zorro-antd 選單
- **鍵盤導航 (Keyboard Navigation)**: 透過 ng-zorro-antd 完全支援
- **螢幕閱讀器 (Screen Reader)**: 宣告上下文變更
- **焦點管理 (Focus Management)**: 選擇時的適當焦點處理

## 未來增強 (Future Enhancements)

可能的新增功能：
- [ ] 搜尋/過濾組織
- [ ] 釘選常用上下文
- [ ] 最近的上下文歷史
- [ ] 自訂上下文圖標
- [ ] 上下文權限顯示
- [ ] 組織/團隊成員計數徽章
