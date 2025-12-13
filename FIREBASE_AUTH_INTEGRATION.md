# Firebase 身份驗證整合說明
# Firebase Authentication Integration Guide

**修復日期**: 2025-12-13  
**問題**: 任務未正確儲存使用者資訊  
**解決方案**: 整合 Firebase Auth，使用真實使用者 ID

---

## 🎯 問題分析

### 原始問題
用戶回報：「任務部分目前了解後發現並沒有真正存入firebase store」

### 根本原因
經過程式碼分析，發現：
1. ✅ 任務**確實有儲存**到 Firebase Firestore
2. ❌ 但使用**硬編碼的佔位符** `'current-user'` 而非真實使用者 ID
3. ❌ 這導致無法追蹤真實使用者，審計日誌無意義

### 受影響的程式碼
```typescript
// ❌ 問題：硬編碼佔位符
createData: {
  creatorId: 'current-user',  // 不是真實使用者
  // ...
}

await taskStore.updateTask(blueprintId, taskId, data, 'current-user');
await taskStore.deleteTask(blueprintId, taskId, 'current-user');
```

---

## 🔧 解決方案

### 1. 整合 FirebaseService

**FirebaseService** 提供統一的身份驗證存取：

```typescript
import { FirebaseService } from '@core/services/firebase.service';

// 注入服務
private firebaseService = inject(FirebaseService);

// 獲取當前使用者
const currentUser = this.firebaseService.getCurrentUser();
const currentUserId = this.firebaseService.getCurrentUserId();
```

### 2. 修復任務建立

**檔案**: `task-modal.component.ts` - `createTask()` 方法

```typescript
private async createTask(formValue: any): Promise<void> {
  // 獲取當前已驗證使用者
  const currentUser = this.firebaseService.getCurrentUser();
  const currentUserId = this.firebaseService.getCurrentUserId();

  // 檢查身份驗證
  if (!currentUserId) {
    this.message.error('請先登入');
    throw new Error('User not authenticated');
  }

  const createData: CreateTaskRequest = {
    // ... 其他欄位
    creatorId: currentUserId,  // ✅ 真實使用者 UID
    creatorName: currentUser?.displayName || currentUser?.email || undefined
  };

  const newTask = await this.taskStore.createTask(
    this.modalData.blueprintId, 
    createData
  );
}
```

### 3. 修復任務更新

**檔案**: `task-modal.component.ts` - `updateTask()` 方法

```typescript
private async updateTask(formValue: any): Promise<void> {
  // 獲取當前使用者 ID
  const currentUserId = this.firebaseService.getCurrentUserId();
  
  if (!currentUserId) {
    this.message.error('請先登入');
    throw new Error('User not authenticated');
  }

  const updateData: UpdateTaskRequest = {
    // ... 更新欄位
    progress: formValue.progress,
  };

  await this.taskStore.updateTask(
    this.modalData.blueprintId,
    taskId,
    updateData,
    currentUserId  // ✅ 真實使用者 UID
  );
}
```

### 4. 修復任務刪除

**檔案**: `tasks.component.ts` - `deleteTask()` 方法

```typescript
async deleteTask(task: Task): Promise<void> {
  try {
    const blueprintId = this._blueprintId();
    const currentUserId = this.firebaseService.getCurrentUserId();

    if (!currentUserId) {
      this.message.warning('請先登入');
      return;
    }

    if (blueprintId && task.id) {
      await this.taskStore.deleteTask(
        blueprintId,
        task.id,
        currentUserId  // ✅ 真實使用者 UID
      );
      this.message.success('任務刪除成功');
    }
  } catch (error) {
    this.logger.error('[TasksComponent]', 'Delete task failed', error);
    this.message.error('任務刪除失敗');
  }
}
```

### 5. 修復看板狀態更新

**檔案**: `task-kanban-view.component.ts` - `onDrop()` 方法

```typescript
async onDrop(event: CdkDragDrop<Task[]>, newStatus: string): Promise<void> {
  if (event.previousContainer !== event.container) {
    const task = event.previousContainer.data[event.previousIndex];
    
    // 獲取當前使用者
    const currentUserId = this.firebaseService.getCurrentUserId();
    if (!currentUserId) {
      this.message.error('請先登入');
      // 還原移動
      transferArrayItem(
        event.container.data,
        event.previousContainer.data,
        event.currentIndex,
        event.previousIndex
      );
      return;
    }

    try {
      await this.taskStore.updateTaskStatus(
        this.blueprintId(),
        task.id!,
        newStatus as TaskStatus,
        currentUserId  // ✅ 真實使用者 UID
      );
      this.message.success('任務狀態已更新');
    } catch (error) {
      this.message.error('更新任務狀態失敗');
      // 還原移動
      transferArrayItem(
        event.container.data,
        event.previousContainer.data,
        event.currentIndex,
        event.previousIndex
      );
    }
  }
}
```

---

## 🎨 架構改進

### Before (問題架構)
```
Component
  ↓
taskStore.createTask({ creatorId: 'current-user' })
  ↓
TasksRepository
  ↓
Firebase Firestore (儲存 creatorId: 'current-user')
```

### After (正確架構)
```
Component
  ↓
FirebaseService.getCurrentUserId() → 真實 UID
  ↓
taskStore.createTask({ creatorId: realUserId })
  ↓
TasksRepository
  ↓
Firebase Firestore (儲存 creatorId: 'abc123xyz...')
```

---

## 🔒 安全性提升

### 1. 身份驗證檢查
所有 CRUD 操作現在都包含身份驗證檢查：

```typescript
if (!currentUserId) {
  this.message.error('請先登入');
  throw new Error('User not authenticated');
}
```

### 2. 錯誤處理
- 未登入使用者無法執行操作
- 顯示友善的錯誤訊息
- 防止無效資料寫入

### 3. 審計追蹤
所有操作現在包含真實使用者資訊：
- `creatorId`: 建立者的真實 Firebase UID
- `creatorName`: 建立者的顯示名稱或 Email
- `actorId`: 執行操作者的真實 Firebase UID

---

## 📊 資料格式變更

### Firestore 文件結構

**Before** (問題):
```json
{
  "id": "task-123",
  "title": "混凝土澆築",
  "creatorId": "current-user",  // ❌ 硬編碼佔位符
  "createdBy": "current-user",  // ❌ 硬編碼佔位符
  "createdAt": "2025-12-13T08:00:00Z"
}
```

**After** (正確):
```json
{
  "id": "task-123",
  "title": "混凝土澆築",
  "creatorId": "abc123xyz789",      // ✅ 真實 Firebase UID
  "creatorName": "張三",             // ✅ 使用者顯示名稱
  "createdBy": "abc123xyz789",      // ✅ 真實 Firebase UID
  "createdAt": "2025-12-13T08:00:00Z"
}
```

---

## ✅ 驗證步驟

### 1. 本地測試

#### 測試 1: 建立任務
```
步驟:
1. 確保已登入 Firebase
2. 建立新任務
3. 檢查 Console: 應顯示 "任務新增成功"
4. 打開 Firebase Console → Firestore
5. 查看新建立的任務文件
6. 驗證 creatorId 是真實的 Firebase UID (例如: "abc123xyz789")
7. 驗證 creatorName 是使用者的顯示名稱或 Email

預期結果:
✅ 任務成功建立
✅ creatorId 是真實 UID
✅ creatorName 是真實名稱
```

#### 測試 2: 未登入狀態
```
步驟:
1. 登出 Firebase
2. 嘗試建立任務
3. 應顯示錯誤訊息: "請先登入"

預期結果:
✅ 顯示錯誤訊息
✅ 任務未建立
✅ 使用者被引導登入
```

#### 測試 3: 編輯任務
```
步驟:
1. 確保已登入
2. 編輯現有任務
3. 檢查 Firestore: updatedAt 時間戳更新
4. 驗證操作記錄包含真實使用者 UID

預期結果:
✅ 任務成功更新
✅ 審計日誌包含真實 actorId
```

#### 測試 4: 刪除任務
```
步驟:
1. 確保已登入
2. 刪除任務
3. 檢查 Firestore: deletedAt 時間戳設定
4. 驗證審計日誌

預期結果:
✅ 任務標記為已刪除
✅ 審計日誌包含真實 actorId
```

#### 測試 5: 看板拖放
```
步驟:
1. 確保已登入
2. 在看板視圖拖放任務
3. 驗證狀態更新
4. 檢查審計日誌

預期結果:
✅ 狀態成功更新
✅ 審計日誌包含真實 actorId
```

### 2. Firebase Console 驗證

**檢查項目**:
1. 打開 Firebase Console
2. 進入 Firestore Database
3. 找到 `blueprints/{blueprintId}/tasks` 集合
4. 檢查任務文件：
   - `creatorId` 應該是真實的 Firebase UID（例如：`abc123xyz789`）
   - `creatorName` 應該是真實的使用者名稱或 Email
   - `createdBy` 應該是真實的 Firebase UID
   - **不應該**看到 `'current-user'` 字串

---

## 📁 修改檔案清單

### 核心變更（3 個檔案）
1. ✅ `src/app/core/blueprint/modules/implementations/tasks/task-modal.component.ts`
   - 注入 FirebaseService
   - createTask() 使用真實使用者
   - updateTask() 使用真實使用者
   
2. ✅ `src/app/core/blueprint/modules/implementations/tasks/tasks.component.ts`
   - 注入 FirebaseService
   - deleteTask() 使用真實使用者
   
3. ✅ `src/app/core/blueprint/modules/implementations/tasks/views/task-kanban-view.component.ts`
   - 注入 FirebaseService
   - onDrop() 狀態更新使用真實使用者

---

## 🚀 部署建議

### 部署前檢查
- [x] 程式碼已完成
- [x] Build 成功
- [x] Lint 通過
- [ ] 手動測試完成
- [ ] Firebase Console 驗證
- [ ] 多用戶測試

### 部署步驟
1. **本地測試**: 驗證所有功能正常
2. **Firebase Console 檢查**: 確認資料格式正確
3. **測試環境部署**: 在測試環境驗證
4. **生產環境部署**: 部署到生產環境
5. **監控**: 監控錯誤日誌和使用者回饋

---

## 💡 關鍵改進總結

### 功能改進
- ✅ 真實使用者追蹤
- ✅ 完整審計追蹤
- ✅ 權限控制基礎
- ✅ 多使用者支援

### 資料品質
- ✅ 真實的使用者資訊
- ✅ 有意義的審計日誌
- ✅ 可追溯的操作歷史

### 安全性
- ✅ 強制身份驗證
- ✅ 錯誤處理
- ✅ 防止無效資料

### 可維護性
- ✅ 移除硬編碼
- ✅ 統一模式
- ✅ 清晰錯誤訊息

---

## 🔮 未來優化建議

### 短期（1-2 週）
1. 添加使用者選擇器（assignee 選擇）
2. 實作權限檢查（只能編輯自己的任務）
3. 添加使用者頭像顯示

### 中期（1-2 月）
1. 實作進階權限系統
2. 添加使用者協作功能
3. 實作任務分配通知

### 長期（3-6 月）
1. 實作完整的使用者管理
2. 添加團隊協作功能
3. 實作使用者活動追蹤

---

## 📞 支援資訊

### 常見問題

**Q: 為什麼任務建立失敗？**  
A: 確保已登入 Firebase。檢查 Console 是否顯示 "請先登入" 錯誤訊息。

**Q: 如何檢查真實使用者 ID？**  
A: 打開 Firebase Console → Authentication → Users，查看 User UID。

**Q: 舊資料怎麼辦？**  
A: 舊資料的 `creatorId` 仍是 `'current-user'`，新資料會使用真實 UID。可以考慮資料遷移腳本。

---

**文件版本**: 1.0  
**最後更新**: 2025-12-13  
**維護者**: GigHub Development Team
