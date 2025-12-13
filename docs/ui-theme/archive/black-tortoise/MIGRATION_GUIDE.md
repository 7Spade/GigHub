# Migration Guide: Black Tortoise → Azure Dragon

> **Status**: Complete | **Complexity**: Low | **Estimated Time**: 30 minutes

This guide helps you migrate from Black Tortoise theme to Azure Dragon theme.

---

## 🎯 Overview

The Azure Dragon theme is already implemented in the codebase (`src/styles/theme.less`, `src/styles/index.less`, `app.config.ts`). This documentation update aligns docs with the actual implementation.

**Key Changes:**
- **Primary Color**: `#1E293B` (Obsidian Black) → `#0EA5E9` (Azure Dragon Blue)
- **Success Color**: `#10B981` (Emerald) → `#14B8A6` (Jade Green)
- **Info Color**: `#1E40AF` (Deep Waters) → `#06B6D4` (Cyan)

---

## 📋 Color Mapping Table

| Black Tortoise | Azure Dragon | Variable Name | Use Case |
|----------------|--------------|---------------|----------|
| `#1E293B` (Obsidian-6) | `#0EA5E9` (Azure-6) | `@primary-color` | Primary brand color |
| `#475569` (Stone-4) | `#14B8A6` (Jade-4) | `@success-color` | Success states |
| `#1E40AF` (Waters-3) | `#06B6D4` (Cyan-3) | `@info-color` | Info states |
| Dark theme | Bright theme | Overall | Visual style |

---

## ✅ Verification Checklist

Since Azure Dragon is already implemented, verify these files match the theme:

### 1. Check `src/styles/theme.less`

```less
// Should contain Azure Dragon colors
@azure-6: #0EA5E9;
@jade-4: #14B8A6;
@cyan-3: #06B6D4;

@primary-color: @azure-6;
@success-color: @jade-4;
@info-color: @cyan-3;
```

### 2. Check `src/app/app.config.ts`

```typescript
const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#0EA5E9',  // Azure-6
    successColor: '#14B8A6',  // Jade-4
    infoColor: '#06B6D4'      // Cyan-3
  }
};
```

### 3. Check `src/styles/index.less`

Should contain Azure Dragon utility classes and styles.

---

## 🔄 If You Need to Revert to Black Tortoise

If you want to restore Black Tortoise theme:

### Step 1: Update `theme.less`

```less
// Black Tortoise colors
@obsidian-6: #1E293B;
@stone-4: #475569;
@waters-3: #1E40AF;

@primary-color: @obsidian-6;
@success-color: #10B981;  // Emerald
@info-color: @waters-3;
```

### Step 2: Update `app.config.ts`

```typescript
const ngZorroConfig: NzConfig = {
  theme: {
    primaryColor: '#1E293B',  // Obsidian-6
    successColor: '#10B981',  // Emerald
    infoColor: '#1E40AF'      // Waters-3
  }
};
```

### Step 3: Rebuild

```bash
yarn build
```

---

## 📚 Resources

- **Azure Dragon Documentation**: [docs/ui-theme/README.md](../README.md)
- **Color System**: [COLOR_SYSTEM_REFERENCE.md](./COLOR_SYSTEM_REFERENCE.md)
- **Black Tortoise Archive**: [archive/black-tortoise/](../archive/black-tortoise/)

---

**Last Updated**: December 2025  
**Maintained by**: GitHub Copilot
