# Blueprint Core Module Agent Guide

The Blueprint Core module provides core infrastructure and services for Blueprint functionality at the application core level.

## Module Purpose

The Blueprint Core module provides:
- **Blueprint Configuration** - Module configuration and settings
- **Blueprint Container** - Container management services
- **Blueprint Context** - Context management for Blueprint operations
- **Blueprint Events** - Event definitions and handling
- **Blueprint Modules** - Module registry and management

## Module Structure

```
src/app/core/blueprint/
├── AGENTS.md                    # This file
├── index.ts                     # Public API exports
├── config/                      # Configuration
├── container/                   # Container services
├── context/                     # Context services
├── events/                      # Event definitions
└── modules/                     # Module registry
```

## Key Components

### Configuration

**規則**:
- 必須定義 Blueprint 模組的配置選項
- 必須提供預設配置值
- 必須支援配置驗證
- 必須匯出配置介面供其他模組使用

### Container

**規則**:
- 必須提供 Blueprint 容器管理服務
- 必須處理容器的生命週期
- 必須管理容器的狀態
- 必須提供容器操作的方法

### Context

**規則**:
- 必須提供 Blueprint 上下文管理服務
- 必須追蹤當前活動的 Blueprint
- 必須提供上下文切換功能
- 必須確保上下文的一致性

### Events

**規則**:
- 必須定義所有 Blueprint 相關事件類型
- 必須提供事件介面定義
- 必須確保事件命名一致性
- 必須支援事件訂閱和發送

### Modules

**規則**:
- 必須維護 Blueprint 模組註冊表
- 必須定義模組元資料
- 必須提供模組查詢功能
- 必須支援模組啟用/停用狀態管理

## Best Practices

**規則**:
1. 必須使用 `inject()` 進行依賴注入
2. 必須使用 Signals 管理狀態
3. 必須實作錯誤處理
4. 必須提供清晰的 API 介面
5. 必須遵循單一職責原則
6. 必須使用 TypeScript 嚴格類型
7. 必須提供 JSDoc 註解

## Related Documentation

- **[Core Services](../AGENTS.md)** - Core infrastructure
- **[Blueprint Module](../../routes/blueprint/AGENTS.md)** - Blueprint feature module

---

**Module Version**: 1.0.0  
**Last Updated**: 2025-12-09  
**Status**: Active Development

