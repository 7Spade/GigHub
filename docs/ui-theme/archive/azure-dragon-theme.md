# 青龍主題設計 (Azure Dragon Theme Design)

## 概述 (Overview)

青龍（Azure Dragon）是中國傳統四象之一，代表東方、春季、木德。在五行中屬木，對應青色（藍綠色系）。本設計以青龍為靈感，創建一套現代化的顏色主題系統。

The Azure Dragon (Qinglong) is one of the Four Symbols in Chinese mythology, representing the East, Spring season, and Wood element. This design creates a modern color theme system inspired by the Azure Dragon.

## 設計理念 (Design Philosophy)

### 青龍象徵意義
- **方位**: 東方 (East)
- **季節**: 春天 (Spring)
- **五行**: 木 (Wood)
- **特性**: 生長、生機、希望、力量
- **顏色**: 青色系（藍綠色調）

### 色彩靈感來源
1. **天空與海洋**: 清晨的天空、深邃的海洋
2. **翡翠與玉石**: 中國傳統寶石的色澤
3. **春天新芽**: 生機盎然的綠意
4. **龍鱗**: 神秘而高貴的藍綠光澤

## 主色調系統 (Primary Color System)

### 主色調 - 青龍藍 (Azure Dragon Blue)
```
Primary Color: #0EA5E9 (Sky Blue)
主色調採用明亮的天藍色，象徵青龍翱翔天際的形象
註：從 Ant Design 默認的 #1890FF 優化為 #0EA5E9 以獲得更現代的視覺效果
```

### 完整色階 (Color Palette)
| 色階 | 顏色代碼 | 用途 | 說明 |
|------|---------|------|------|
| azure-1 | #E6F7FF | 背景淺色 | 最淺的青色，用於背景 |
| azure-2 | #BAE7FF | 懸停淺色 | 輕微交互效果 |
| azure-3 | #91D5FF | 次要元素 | 次要按鈕、標籤 |
| azure-4 | #69C0FF | 次要強調 | 輕度強調元素 |
| azure-5 | #40A9FF | 輔助色 | 輔助性視覺元素 |
| **azure-6** | **#0EA5E9** | **主色** | **主要品牌色** |
| azure-7 | #0C83BA | 主色深化 | 懸停、選中狀態 |
| azure-8 | #0A688B | 深色強調 | 強調、高對比 |
| azure-9 | #084C5C | 最深強調 | 最深的強調色 |
| azure-10 | #06303D | 深色背景 | 暗色模式使用 |

## 輔助色系統 (Secondary Color System)

### 翡翠綠 (Jade Green) - 龍鱗
象徵青龍身上的翡翠色鱗片，代表生機與活力。

| 色階 | 顏色代碼 | 說明 |
|------|---------|------|
| jade-1 | #E6FFF9 | 最淺翡翠綠 |
| jade-2 | #B3FFE6 | 淺翡翠綠 |
| jade-3 | #7FFFD4 | 中等翡翠綠 |
| **jade-4** | **#14B8A6** | **主翡翠綠** |
| jade-5 | #0D9488 | 深翡翠綠 |
| jade-6 | #0A7C6C | 最深翡翠綠 |

### 青綠漸變 (Cyan Gradient) - 龍息
象徵青龍的神秘氣息，藍綠交融。

| 色階 | 顏色代碼 | 說明 |
|------|---------|------|
| cyan-1 | #E0F7FA | 最淺青綠 |
| cyan-2 | #B2EBF2 | 淺青綠 |
| **cyan-3** | **#06B6D4** | **主青綠** |
| cyan-4 | #0891B2 | 深青綠 |
| cyan-5 | #0E7490 | 最深青綠 |

### 寶藍 (Sapphire Blue) - 夜空
象徵夜空中青龍的身影，神秘而深邃。

| 色階 | 顏色代碼 | 說明 |
|------|---------|------|
| sapphire-1 | #EFF6FF | 最淺寶藍 |
| sapphire-2 | #DBEAFE | 淺寶藍 |
| **sapphire-3** | **#3B82F6** | **主寶藍** |
| sapphire-4 | #2563EB | 深寶藍 |
| sapphire-5 | #1E40AF | 最深寶藍 |

## 漸變色系統 (Gradient System)

### 主要漸變 (Primary Gradients)

#### 1. 龍躍雲端 (Dragon Soaring)
```css
background: linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%);
```
用途：主要按鈕、英雄區塊、重要卡片背景

#### 2. 碧海青天 (Azure Sky & Sea)
```css
background: linear-gradient(180deg, #0EA5E9 0%, #06B6D4 50%, #14B8A6 100%);
```
用途：大型橫幅、頁面背景

#### 3. 青龍鱗片 (Dragon Scales)
```css
background: linear-gradient(45deg, #0C83BA 0%, #0D9488 50%, #0EA5E9 100%);
```
用途：裝飾性元素、邊框漸變

#### 4. 晨曦微光 (Dawn Light)
```css
background: linear-gradient(135deg, #E6F7FF 0%, #E0F7FA 50%, #E6FFF9 100%);
```
用途：淺色背景、卡片背景

#### 5. 深海神秘 (Deep Mystery)
```css
background: linear-gradient(135deg, #084C5C 0%, #0A7C6C 100%);
```
用途：暗色模式主背景

### 漸變變化 (Gradient Variations)

#### 徑向漸變 (Radial Gradients)
```css
/* 龍珠光暈 */
background: radial-gradient(circle at center, #0EA5E9 0%, #06B6D4 50%, transparent 100%);

/* 能量波紋 */
background: radial-gradient(ellipse at center, #14B8A6 0%, #0EA5E9 40%, transparent 70%);
```

## 配色方案 (Color Schemes)

### 淺色主題 (Light Theme)
```less
// 主色
@primary-color: #0EA5E9;
@link-color: #0EA5E9;
@success-color: #14B8A6;
@warning-color: #F59E0B;
@error-color: #EF4444;
@info-color: #06B6D4;

// 背景色
@body-background: #F8FAFC;
@component-background: #FFFFFF;
@layout-body-background: #F1F5F9;

// 文字色
@text-color: #1E293B;
@text-color-secondary: #64748B;
@heading-color: #0F172A;

// 邊框色
@border-color-base: #CBD5E1;
@border-color-split: #E2E8F0;
```

### 暗色主題 (Dark Theme)
```less
// 主色
@primary-color: #06B6D4;
@link-color: #06B6D4;
@success-color: #10B981;
@warning-color: #F59E0B;
@error-color: #EF4444;
@info-color: #0EA5E9;

// 背景色
@body-background: #0F172A;
@component-background: #1E293B;
@layout-body-background: #020617;

// 文字色
@text-color: #F1F5F9;
@text-color-secondary: #94A3B8;
@heading-color: #F8FAFC;

// 邊框色
@border-color-base: #334155;
@border-color-split: #475569;
```

## 語義化配色 (Semantic Colors)

### 功能狀態色
| 狀態 | 顏色 | 代碼 | 說明 |
|------|------|------|------|
| 成功 | 翡翠綠 | #14B8A6 | 操作成功、正面反饋 |
| 警告 | 琥珀黃 | #F59E0B | 需要注意的信息 |
| 錯誤 | 赤紅 | #EF4444 | 錯誤、危險操作 |
| 信息 | 青藍 | #06B6D4 | 一般信息提示 |

### 互動狀態
```less
// 懸停態
@hover-color: #40A9FF;
@hover-bg: #E6F7FF;

// 激活態
@active-color: #0C83BA;
@active-bg: #BAE7FF;

// 禁用態
@disabled-color: #94A3B8;
@disabled-bg: #F1F5F9;
```

## 應用示例 (Application Examples)

### 按鈕 (Buttons)
```css
/* 主要按鈕 */
.btn-primary {
  background: linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%);
  border: none;
  color: #FFFFFF;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0C83BA 0%, #0D9488 100%);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
}

/* 次要按鈕 */
.btn-secondary {
  background: transparent;
  border: 2px solid #0EA5E9;
  color: #0EA5E9;
}

.btn-secondary:hover {
  background: #E6F7FF;
  border-color: #40A9FF;
}
```

### 卡片 (Cards)
```css
/* 標準卡片 */
.card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}

/* 高亮卡片 */
.card-highlight {
  background: linear-gradient(135deg, #E6F7FF 0%, #E6FFF9 100%);
  border: 2px solid #0EA5E9;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
}

/* 特色卡片 */
.card-featured {
  background: linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%);
  color: #FFFFFF;
  border: none;
}
```

### 導航 (Navigation)
```css
/* 側邊欄 */
.sidebar {
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
  border-right: 1px solid #E2E8F0;
}

/* 激活項 */
.sidebar-item-active {
  background: linear-gradient(90deg, #0EA5E9 0%, transparent 100%);
  color: #0EA5E9;
  border-left: 3px solid #0EA5E9;
}

/* 頂部導航 */
.navbar {
  background: linear-gradient(90deg, #0EA5E9 0%, #14B8A6 100%);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
}
```

## 陰影系統 (Shadow System)

### 陰影層級
```css
/* 微陰影 - 卡片、按鈕 */
--shadow-sm: 0 1px 2px rgba(14, 165, 233, 0.05);

/* 標準陰影 - 浮動元素 */
--shadow-md: 0 4px 6px rgba(14, 165, 233, 0.1);

/* 較大陰影 - 彈窗、抽屜 */
--shadow-lg: 0 10px 15px rgba(14, 165, 233, 0.15);

/* 超大陰影 - 模態框 */
--shadow-xl: 0 20px 25px rgba(14, 165, 233, 0.2);

/* 青龍光暈效果 */
--glow-azure: 0 0 20px rgba(14, 165, 233, 0.5);
--glow-jade: 0 0 20px rgba(20, 184, 166, 0.5);
```

## 動畫與過渡 (Animations & Transitions)

### 標準過渡
```css
/* 標準過渡時間 */
--transition-fast: 0.15s ease;
--transition-base: 0.3s ease;
--transition-slow: 0.5s ease;

/* 青龍特效 */
@keyframes dragon-flow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.dragon-effect {
  background: linear-gradient(270deg, #0EA5E9, #14B8A6, #06B6D4, #0EA5E9);
  background-size: 400% 400%;
  animation: dragon-flow 8s ease infinite;
}
```

### 脈衝效果
```css
@keyframes dragon-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(14, 165, 233, 0);
  }
}

.pulse-effect {
  animation: dragon-pulse 2s ease-in-out infinite;
}
```

## 使用指南 (Usage Guidelines)

### 最佳實踐

1. **主色使用**
   - 主要行為按鈕、鏈接使用主色 #0EA5E9
   - 避免大面積使用主色，保持視覺平衡
   - 重要信息使用主色高亮

2. **漸變使用**
   - 大型背景使用淺色漸變
   - 按鈕、標籤使用主要漸變
   - 避免過多漸變造成視覺混亂

3. **對比度**
   - 確保文字與背景對比度至少 4.5:1
   - 重要信息使用高對比度配色
   - 暗色主題注意調整對比度

4. **可訪問性**
   - 不僅依賴顏色傳達信息
   - 提供圖標、文字等多重提示
   - 支持鍵盤導航

### 不推薦的做法

❌ 避免使用純黑色 (#000000)，使用深藍灰 (#0F172A)
❌ 避免使用過於鮮豔的顏色組合
❌ 避免在小面積元素上使用漸變
❌ 避免過度使用動畫效果

## 品牌識別 (Brand Identity)

### Logo 配色建議
```
主色方案：#0EA5E9 (青龍藍) + #14B8A6 (翡翠綠)
輔助方案：#06B6D4 (青綠) + #3B82F6 (寶藍)
```

### 視覺元素
- 使用流動的曲線表現龍的姿態
- 結合中國傳統雲紋、水波紋圖案
- 漸變方向建議：左下至右上，象徵升龍

## 技術實現 (Technical Implementation)

### LESS 變量定義
```less
// Azure Dragon Theme Variables
@azure-dragon-primary: #0EA5E9;
@azure-dragon-secondary: #14B8A6;
@azure-dragon-tertiary: #06B6D4;

// Gradient Definitions
@gradient-dragon-soaring: linear-gradient(135deg, @azure-dragon-primary 0%, @azure-dragon-secondary 100%);
@gradient-azure-sky: linear-gradient(180deg, @azure-dragon-primary 0%, @azure-dragon-tertiary 50%, @azure-dragon-secondary 100%);

// Shadow Definitions
@shadow-azure-sm: 0 1px 2px rgba(14, 165, 233, 0.05);
@shadow-azure-md: 0 4px 6px rgba(14, 165, 233, 0.1);
@shadow-azure-lg: 0 10px 15px rgba(14, 165, 233, 0.15);
```

### CSS 自定義屬性
```css
:root {
  /* Primary Colors */
  --azure-1: #E6F7FF;
  --azure-2: #BAE7FF;
  --azure-3: #91D5FF;
  --azure-4: #69C0FF;
  --azure-5: #40A9FF;
  --azure-6: #0EA5E9;
  --azure-7: #0C83BA;
  --azure-8: #0A688B;
  --azure-9: #084C5C;
  --azure-10: #06303D;
  
  /* Secondary Colors */
  --jade-primary: #14B8A6;
  --cyan-primary: #06B6D4;
  --sapphire-primary: #3B82F6;
  
  /* Gradients */
  --gradient-dragon-soaring: linear-gradient(135deg, var(--azure-6) 0%, var(--jade-primary) 100%);
  --gradient-azure-sky: linear-gradient(180deg, var(--azure-6) 0%, var(--cyan-primary) 50%, var(--jade-primary) 100%);
}
```

## 版本歷史 (Version History)

- **v1.0.0** (2025-12-08) - 初始版本，建立青龍主題基礎色彩系統

## 參考資料 (References)

- 中國傳統四象文化
- 現代扁平化設計原則
- Material Design 色彩系統
- Ant Design 設計語言
- Tailwind CSS 色彩哲學

---

**設計師**: GitHub Copilot Agent
**最後更新**: 2025-12-08
**版本**: 1.0.0
