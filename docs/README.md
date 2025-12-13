# GigHub 專案文檔 (Project Documentation)

歡迎來到 **GigHub 工地施工進度追蹤管理系統** 文檔中心！

本文檔提供完整的專案指南、架構設計、開發規範和 UI 主題文檔。

**專案**: GigHub - 工地施工進度追蹤管理系統  
**技術棧**: Angular 20.3 + ng-zorro-antd + ng-alain + Firebase + Supabase

---

## 📚 文檔導航 (Documentation Navigation)

文檔已重新組織為清晰的模組化結構，並提供繁體中文版本。

### 🏗️ 開發指南 (Development Guides) - [`development/`](./development/)

| 文檔 | 描述 | 語言 | 狀態 |
|------|------|------|------|
| [共享模組指南](./development/shared-modules-guide.md) | SHARED_IMPORTS 使用與優化 | 繁中 | ✅ |

**主要內容**: SHARED_IMPORTS、OPTIONAL 模組、圖標管理、性能優化

---

### 🔐 身份驗證 (Authentication) - [`authentication/`](./authentication/)

| 文檔 | 描述 | 語言 | 狀態 |
|------|------|------|------|
| [Firebase Authentication](./authentication/firebase-authentication.md) | Firebase Auth 整合指南 | 繁中 | ✅ |
| [Supabase Integration](./authentication/supabase-integration.md) | Supabase 統計整合 | 繁中 | ✅ |

**關鍵職責劃分**:
- **Firebase** → 認證 (登入、註冊、Token)
- **Supabase** → 統計/非敏感資料
- **@delon/auth** → Token 管理、路由守衛

**舊版參考**:
- [FIREBASE_AUTH_IMPLEMENTATION_SUMMARY.md](authentication/FIREBASE_AUTH_IMPLEMENTATION_SUMMARY.md) (EN)
- [FIREBASE_AUTH_INTEGRATION.md](authentication/FIREBASE_AUTH_INTEGRATION.md) (EN)
- [SUPABASE_SIMPLIFICATION.md](authentication/SUPABASE_SIMPLIFICATION.md) (EN)

---

### 🎨 UI 主題 (UI Theme) - [`ui-theme/`](./ui-theme/)

| 文檔 | 描述 | 語言 | 狀態 |
|------|------|------|------|
| [Azure Dragon 主題指南](./ui-theme/azure-dragon-theme-zh-TW.md) | 完整主題使用指南 | 繁中 | ✅ |
| [懸停狀態改進](./ui-theme/hover-states-improvements-zh-TW.md) | 互動效果詳解 | 繁中 | ✅ |
| [UI 主題 README](./ui-theme/README-zh-TW.md) | 主題文檔索引 | 繁中 | ✅ |

**技術資源**:
- [LESS 變量](./ui-theme/azure-dragon-theme-variables.less)
- [編譯 CSS](./ui-theme/azure-dragon-theme.css)
- [程式碼範例](./ui-theme/azure-dragon-theme-examples.md) (EN)
- [實時預覽](./ui-theme/demo.html)

**舊版參考**:
- [README](./ui-theme/README.md) (EN)
- [AZURE_DRAGON_INTEGRATION.md](ui-theme/AZURE_DRAGON_INTEGRATION.md) (EN)
- [AZURE_DRAGON_IMPLEMENTATION_SUMMARY.md](ui-theme/AZURE_DRAGON_IMPLEMENTATION_SUMMARY.md) (EN)
- [AZURE_DRAGON_VISUAL_REFERENCE.md](ui-theme/AZURE_DRAGON_VISUAL_REFERENCE.md) (EN)

---

### 🎯 設計文檔 (Design Documentation) - [`design/`](./design/)

| 文檔 | 描述 | 語言 | 狀態 |
|------|------|------|------|
| [設計文檔索引](./design/README-zh-TW.md) | 設計文檔總覽 | 繁中 | ✅ |
| [SaaS 多租戶實作](./design/saas-implementation-zh-TW.md) | 多租戶架構設計 | 繁中 | ✅ |

**核心概念**:
- **Blueprint** = 邏輯容器（任務、日誌、QA）
- **擁有權**: User/Organization 可建立；Team/Bot 只讀
- **上下文切換**: USER → ORGANIZATION → TEAM → BOT
- **權限模型**: RBAC + RLS 政策

**舊版參考** (待遷移):
- [SAAS_IMPLEMENTATION.md](./SAAS_IMPLEMENTATION.md) (EN)
- [CONTEXT_SWITCHER_UI.md](./CONTEXT_SWITCHER_UI.md) (EN)
- [BLUEPRINT_CONTAINER_DESIGN.md](./BLUEPRINT_CONTAINER_DESIGN.md) (EN)
- [BLUEPRINT_CONCEPT_EXPLAINED.md](./BLUEPRINT_CONCEPT_EXPLAINED.md) (EN)
- [SIDEBAR_FEATURES_DESIGN.md](./SIDEBAR_FEATURES_DESIGN.md) (繁中)
- [DESIGN_SUMMARY.md](./DESIGN_SUMMARY.md) (繁中)

---

### 📁 舊版架構文檔 (Legacy Architecture Docs) - [`architecture/`](./architecture/)

**已整合到其他資料夾**:
- SHARED_IMPORTS_GUIDE.md → [`development/shared-modules-guide.md`](./development/shared-modules-guide.md) ✅
- SHARED_MODULES_OPTIMIZATION.md → 已整合 ✅

## 📖 技術棧 (Tech Stack)

- **Angular**: 20.3.x (Standalone Components, Signals)
- **ng-alain**: 20.1.x | **ng-zorro-antd**: 20.3.x
- **Firebase**: @angular/fire 20.0.1 (Authentication)
- **Supabase**: 2.86.x (BaaS, RLS Policies)
- **TypeScript**: 5.9.x | **RxJS**: 7.8.x

---

## 🚀 快速導航 (Quick Navigation)

### 我想要...

#### 開始開發
→ [共享模組指南](./development/shared-modules-guide.md)  
→ [Azure Dragon 主題](./ui-theme/azure-dragon-theme-zh-TW.md)

#### 設置身份驗證
→ [Firebase Authentication](./authentication/firebase-authentication.md)  
→ [Supabase Integration](./authentication/supabase-integration.md)

#### 了解專案架構
→ [設計文檔索引](./design/README-zh-TW.md)  
→ [SaaS 多租戶實作](./design/saas-implementation-zh-TW.md)

#### 自訂 UI 樣式
→ [Azure Dragon 主題指南](./ui-theme/azure-dragon-theme-zh-TW.md)  
→ [懸停狀態改進](./ui-theme/hover-states-improvements-zh-TW.md)

#### 測試 UI 元件
→ [測試檢查清單](./ui-theme/TESTING_CHECKLIST.md)  
→ [實時預覽](./ui-theme/demo.html)

---

## 🛠️ 開發工具 (Development Tools)

### 常用命令

```bash
# 啟動開發伺服器
yarn start

# 建置專案
yarn build

# 執行測試
yarn test

# Lint 檢查
yarn lint

# 更新圖標
yarn icon

# 分析 Bundle 大小
yarn analyze
yarn analyze:view
```

---

## 📦 封存文檔 (Archived Documentation)

已完成的功能文檔已移至 [`archive/`](./archive/) 目錄：

### 最新封存 (2025-12-13)
- ✅ Blueprint 架構分析與遷移文檔 (9 個文件)
- ✅ Task Module 功能實作文檔 (5 個文件)
- ✅ 建置修復與實作總結文檔
- ✅ Supabase 遷移文檔（已標記為過時）
- ✅ 探索搜尋架構與日誌領域遷移計畫

**⚠️ Supabase 相關文檔**: 專案已遷移至 Firebase，Supabase 文檔已移至 `archive/obsolete/` 並標記為過時。

**查看完整封存清單**: [archive/README.md](./archive/README.md)

---

## 📝 變更記錄 (Changelog)

### v3.0.0 (2025-12-13) - 文檔清理與 Supabase 移除

**封存**:
- ✅ 移動 Blueprint 分析文檔至 archive/blueprint-analysis/ (9 個)
- ✅ 移動 Task Module 文檔至 archive/task-module/ (5 個)
- ✅ 移動建置修復與實作總結至 archive/implementation-summaries/
- ✅ 移動搜尋架構與遷移計畫至 archive/analysis-reports/ 和 archive/migration-guides/

**清理**:
- ✅ 清理 docs/ 根目錄，移除已完成的分析與總結文檔
- ✅ 整理 Supabase 相關文檔，標記為 OBSOLETE
- ✅ 移動 Supabase 部署指南至 archive/obsolete/supabase-migration/
- ✅ 更新 archive/README.md 新增清晰索引與搜尋指南
- ✅ 組織 setc.md 至 setc/specification.md

**Supabase 處理**:
- ⚠️ 標記 migration-guides 中 Supabase 遷移文檔為 OBSOLETE
- ⚠️ 保留 Supabase 文檔作為歷史參考（專案已遷移至 Firebase）

### v2.0.0 (2025-12-12) - 文檔封存更新

**封存**:
- ✅ 移動 10 個已完成文檔至 archive
- ✅ 新增 4 個封存分類目錄
- ✅ 更新 archive/README.md 記錄新封存

**清理**:
- ✅ docs/ 根目錄保留 9 個活躍文檔
- ✅ 移除已完成功能的文檔參考

### v1.0.0 (2025-01-09) - 文檔重組與中文化

**✨ 新增**:
- ✅ 建立清晰的模組化文檔結構
- ✅ 完整的中文文檔（development、authentication、ui-theme、design）
- ✅ 文檔索引與導航系統
- ✅ 設計文檔資料夾與索引

**♻️ 重構**:
- ✅ 整合 SHARED_IMPORTS_GUIDE + SHARED_MODULES_OPTIMIZATION
- ✅ 整合 Firebase auth 文檔
- ✅ 整合 Supabase 文檔
- ✅ 整合 Azure Dragon 主題文檔

**📚 中文化**:
- ✅ 共享模組指南
- ✅ Firebase Authentication
- ✅ Supabase Integration
- ✅ Azure Dragon 主題完整指南
- ✅ 懸停狀態改進
- ✅ SaaS 多租戶實作

### 2025-12-09 - Blueprint & Sidebar Design (舊版)
- ✅ Blueprint 邏輯容器設計
- ✅ 側邊欄功能設計
- ✅ 上下文切換器實作

### 2025-12-08 - Firebase Auth & SaaS (舊版)
- ✅ Firebase 認證整合
- ✅ SaaS 多租戶架構

---

**維護者**: GitHub Copilot  
**專案**: GigHub - 工地施工進度追蹤管理系統  
**文件版本**: 1.0.0  
**最後更新**: 2025-01-09
