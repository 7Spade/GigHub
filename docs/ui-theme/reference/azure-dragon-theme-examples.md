# 青龍主題視覺參考 (Azure Dragon Theme Visual Reference)

本文檔提供青龍主題的視覺示例和 CSS 代碼片段。

## 快速開始 (Quick Start)

### 1. 導入主題變量

在 `src/styles/theme.less` 中添加：

```less
@import '../docs/azure-dragon-theme-variables.less';
```

### 2. 基本使用示例

```html
<!-- 主色按鈕 -->
<button class="azure-btn-primary">青龍按鈕</button>

<!-- 漸變背景卡片 -->
<div class="azure-card-gradient">
  <h3>青龍主題卡片</h3>
  <p>這是一個使用青龍主題的卡片示例</p>
</div>
```

## 顏色示例 (Color Swatches)

### 主色調 - Azure Blue

<div style="display: flex; gap: 10px; margin: 20px 0;">
  <div style="width: 60px; height: 60px; background: #E6F7FF; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #BAE7FF; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #91D5FF; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #69C0FF; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #40A9FF; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #0EA5E9; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #0C83BA; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #0A688B; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #084C5C; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: #06303D; border: 1px solid #ccc; border-radius: 4px;"></div>
</div>

```
#E6F7FF  #BAE7FF  #91D5FF  #69C0FF  #40A9FF
#0EA5E9  #0C83BA  #0A688B  #084C5C  #06303D
```

### 翡翠綠 - Jade Green

<div style="display: flex; gap: 10px; margin: 20px 0;">
  <div style="width: 80px; height: 60px; background: #E6FFF9; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 80px; height: 60px; background: #B3FFE6; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 80px; height: 60px; background: #7FFFD4; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 80px; height: 60px; background: #14B8A6; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 80px; height: 60px; background: #0D9488; border: 1px solid #ccc; border-radius: 4px;"></div>
  <div style="width: 80px; height: 60px; background: #0A7C6C; border: 1px solid #ccc; border-radius: 4px;"></div>
</div>

```
#E6FFF9  #B3FFE6  #7FFFD4  #14B8A6  #0D9488  #0A7C6C
```

## CSS 組件示例 (Component Examples)

### 按鈕 (Buttons)

```css
/* 主要按鈕 - 龍躍雲端 */
.azure-btn-primary {
  background: linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%);
  border: none;
  border-radius: 6px;
  color: #FFFFFF;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);
}

.azure-btn-primary:hover {
  background: linear-gradient(135deg, #0C83BA 0%, #0D9488 100%);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
  transform: translateY(-2px);
}

.azure-btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);
}

/* 次要按鈕 - 描邊 */
.azure-btn-secondary {
  background: transparent;
  border: 2px solid #0EA5E9;
  border-radius: 6px;
  color: #0EA5E9;
  padding: 8px 22px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.azure-btn-secondary:hover {
  background: #E6F7FF;
  border-color: #40A9FF;
  color: #40A9FF;
}

/* 文字按鈕 */
.azure-btn-text {
  background: transparent;
  border: none;
  color: #0EA5E9;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.azure-btn-text:hover {
  color: #40A9FF;
  background: rgba(14, 165, 233, 0.05);
  border-radius: 4px;
}
```

### 卡片 (Cards)

```css
/* 標準卡片 */
.azure-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
  transition: all 0.3s ease;
}

.azure-card:hover {
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
  transform: translateY(-4px);
}

/* 漸變背景卡片 */
.azure-card-gradient {
  background: linear-gradient(135deg, #E6F7FF 0%, #E6FFF9 100%);
  border: 2px solid #0EA5E9;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
  position: relative;
  overflow: hidden;
}

.azure-card-gradient::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(30px, -30px);
}

/* 特色卡片 - 深色背景 */
.azure-card-featured {
  background: linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%);
  border: none;
  border-radius: 12px;
  padding: 24px;
  color: #FFFFFF;
  box-shadow: 0 8px 16px rgba(14, 165, 233, 0.3);
}

.azure-card-featured h3 {
  color: #FFFFFF;
  margin-bottom: 12px;
}

.azure-card-featured p {
  color: rgba(255, 255, 255, 0.9);
}
```

### 輸入框 (Input Fields)

```css
/* 標準輸入框 */
.azure-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  font-size: 14px;
  color: #1E293B;
  background: #FFFFFF;
  transition: all 0.3s ease;
}

.azure-input:focus {
  outline: none;
  border-color: #0EA5E9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.azure-input::placeholder {
  color: #94A3B8;
}

/* 帶圖標的輸入框 */
.azure-input-group {
  position: relative;
  display: inline-block;
  width: 100%;
}

.azure-input-group input {
  padding-left: 40px;
}

.azure-input-group .icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #0EA5E9;
  font-size: 18px;
}
```

### 標籤 (Tags)

```css
/* 主色標籤 */
.azure-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #E6F7FF;
  color: #0EA5E9;
  border: 1px solid #91D5FF;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* 翡翠綠標籤 */
.azure-tag-jade {
  background: #E6FFF9;
  color: #14B8A6;
  border-color: #7FFFD4;
}

/* 漸變標籤 */
.azure-tag-gradient {
  background: linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%);
  color: #FFFFFF;
  border: none;
}
```

### 導航欄 (Navigation Bar)

```css
/* 頂部導航 */
.azure-navbar {
  background: linear-gradient(90deg, #0EA5E9 0%, #14B8A6 100%);
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
}

.azure-navbar-logo {
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 600;
  margin-right: 48px;
}

.azure-navbar-menu {
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 1;
}

.azure-navbar-item {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.azure-navbar-item:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
}

.azure-navbar-item.active {
  background: rgba(255, 255, 255, 0.25);
  color: #FFFFFF;
  font-weight: 500;
}
```

### 側邊欄 (Sidebar)

```css
/* 側邊欄容器 */
.azure-sidebar {
  width: 240px;
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
  border-right: 1px solid #E2E8F0;
  height: 100vh;
  padding: 24px 0;
}

/* 側邊欄項目 */
.azure-sidebar-item {
  padding: 12px 24px;
  color: #1E293B;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.azure-sidebar-item:hover {
  background: rgba(14, 165, 233, 0.05);
  color: #0EA5E9;
}

.azure-sidebar-item.active {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.1) 0%, transparent 100%);
  color: #0EA5E9;
  border-left-color: #0EA5E9;
  font-weight: 500;
}

.azure-sidebar-icon {
  font-size: 18px;
}
```

## 動畫效果 (Animation Effects)

### 脈衝效果

```css
@keyframes azure-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(14, 165, 233, 0);
  }
}

.azure-pulse {
  animation: azure-pulse 2s ease-in-out infinite;
}
```

### 流動漸變

```css
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

.azure-dragon-flow {
  background: linear-gradient(270deg, #0EA5E9, #14B8A6, #06B6D4, #0EA5E9);
  background-size: 400% 400%;
  animation: dragon-flow 8s ease infinite;
}
```

### 懸浮上升

```css
.azure-hover-lift {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.azure-hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(14, 165, 233, 0.2);
}
```

## 響應式設計 (Responsive Design)

```css
/* 移動設備 */
@media (max-width: 768px) {
  .azure-navbar {
    padding: 0 16px;
  }
  
  .azure-sidebar {
    width: 60px;
  }
  
  .azure-sidebar-item {
    justify-content: center;
  }
  
  .azure-sidebar-item span:not(.azure-sidebar-icon) {
    display: none;
  }
}

/* 平板設備 */
@media (min-width: 769px) and (max-width: 1024px) {
  .azure-sidebar {
    width: 200px;
  }
}

/* 桌面設備 */
@media (min-width: 1025px) {
  .azure-sidebar {
    width: 240px;
  }
}
```

## 無障礙設計 (Accessibility)

### 焦點樣式

```css
/* 鍵盤焦點樣式 */
.azure-btn-primary:focus-visible,
.azure-btn-secondary:focus-visible,
.azure-input:focus-visible {
  outline: 2px solid #0EA5E9;
  outline-offset: 2px;
}

/* 跳過內容鏈接 */
.azure-skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #0EA5E9;
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 0 0 4px 0;
}

.azure-skip-link:focus {
  top: 0;
}
```

## 使用範例 HTML (Example HTML)

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>青龍主題示例</title>
  <link rel="stylesheet" href="azure-dragon-theme.css">
</head>
<body>
  <!-- 導航欄 -->
  <nav class="azure-navbar">
    <div class="azure-navbar-logo">🐉 青龍系統</div>
    <div class="azure-navbar-menu">
      <a href="#" class="azure-navbar-item active">首頁</a>
      <a href="#" class="azure-navbar-item">產品</a>
      <a href="#" class="azure-navbar-item">關於</a>
    </div>
  </nav>
  
  <!-- 內容區 -->
  <div style="display: flex;">
    <!-- 側邊欄 -->
    <aside class="azure-sidebar">
      <a href="#" class="azure-sidebar-item active">
        <span class="azure-sidebar-icon">🏠</span>
        <span>儀表板</span>
      </a>
      <a href="#" class="azure-sidebar-item">
        <span class="azure-sidebar-icon">📊</span>
        <span>數據分析</span>
      </a>
      <a href="#" class="azure-sidebar-item">
        <span class="azure-sidebar-icon">⚙️</span>
        <span>設置</span>
      </a>
    </aside>
    
    <!-- 主內容 -->
    <main style="flex: 1; padding: 24px;">
      <div class="azure-card-gradient">
        <h2>歡迎使用青龍主題</h2>
        <p>這是一個基於中國傳統四象之青龍設計的現代化主題系統。</p>
        <button class="azure-btn-primary">開始使用</button>
      </div>
      
      <div style="margin-top: 24px;" class="azure-card">
        <h3>功能特色</h3>
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <span class="azure-tag">現代設計</span>
          <span class="azure-tag-jade">響應式</span>
          <span class="azure-tag-gradient">高性能</span>
        </div>
      </div>
    </main>
  </div>
</body>
</html>
```

## 整合到 Angular 項目 (Integration with Angular)

### 在組件中使用

```typescript
// app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="azure-navbar">
      <div class="azure-navbar-logo">🐉 青龍系統</div>
    </div>
    
    <div class="azure-card-gradient">
      <h2>{{ title }}</h2>
      <button class="azure-btn-primary" (click)="onClick()">
        點擊我
      </button>
    </div>
  `,
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  title = '青龍主題演示';
  
  onClick() {
    console.log('Button clicked!');
  }
}
```

```less
// app.component.less
@import '../../docs/azure-dragon-theme-variables.less';

:host {
  display: block;
  min-height: 100vh;
  background: @body-background;
}
```

---

**最後更新**: 2025-12-08
**版本**: 1.0.0
