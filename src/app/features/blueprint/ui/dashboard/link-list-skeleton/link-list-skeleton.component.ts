import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzInputModule } from 'ng-zorro-antd/input';

// 連結分類
type LinkCategory = 'document' | 'design' | 'reference' | 'other';

// 連結介面
interface ExternalLink {
  id: string;
  url: string;
  title: string;
  description: string;
  category: LinkCategory;
  siteName: string;
  faviconUrl: string;
  isValid: boolean;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

// Mock 資料
const MOCK_LINKS: ExternalLink[] = [
  {
    id: '1',
    url: 'https://docs.google.com/spreadsheets/example',
    title: '工程進度追蹤表',
    description: '專案進度甘特圖與里程碑追蹤',
    category: 'document',
    siteName: 'Google Sheets',
    faviconUrl: 'https://www.google.com/favicon.ico',
    isValid: true,
    createdBy: { id: '1', name: '王主任' },
    createdAt: '2025-11-20T10:00:00Z'
  },
  {
    id: '2',
    url: 'https://www.figma.com/file/example',
    title: '建築設計圖',
    description: '主體結構設計圖與立面圖',
    category: 'design',
    siteName: 'Figma',
    faviconUrl: 'https://www.figma.com/favicon.ico',
    isValid: true,
    createdBy: { id: '2', name: '李設計師' },
    createdAt: '2025-11-18T14:30:00Z'
  },
  {
    id: '3',
    url: 'https://law.moj.gov.tw/example',
    title: '建築技術規則',
    description: '建築設計施工編相關法規',
    category: 'reference',
    siteName: '全國法規資料庫',
    faviconUrl: 'https://law.moj.gov.tw/favicon.ico',
    isValid: true,
    createdBy: { id: '1', name: '王主任' },
    createdAt: '2025-11-15T09:00:00Z'
  },
  {
    id: '4',
    url: 'https://drive.google.com/folder/example',
    title: '專案共享資料夾',
    description: '合約文件、會議紀錄、照片',
    category: 'document',
    siteName: 'Google Drive',
    faviconUrl: 'https://www.google.com/favicon.ico',
    isValid: true,
    createdBy: { id: '1', name: '王主任' },
    createdAt: '2025-11-10T08:00:00Z'
  },
  {
    id: '5',
    url: 'https://expired-link.example.com',
    title: '舊版規範文件',
    description: '已過期的參考資料',
    category: 'other',
    siteName: 'Example',
    faviconUrl: '',
    isValid: false,
    createdBy: { id: '3', name: '陳工程師' },
    createdAt: '2025-10-01T10:00:00Z'
  }
];

@Component({
  selector: 'app-link-list-skeleton',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzDropDownModule,
    NzToolTipModule,
    NzEmptyModule,
    NzInputModule
  ],
  template: `
    <div class="link-list-skeleton">
      <div class="toolbar">
        <div class="toolbar-left">
          <button nz-button nzType="primary">
            <span nz-icon nzType="plus" nzTheme="outline"></span>
            新增連結
          </button>
        </div>
        <div class="toolbar-right">
          <nz-input-group [nzPrefix]="prefixIcon" style="width: 200px;">
            <input nz-input placeholder="搜尋連結..." />
          </nz-input-group>
          <ng-template #prefixIcon>
            <span nz-icon nzType="search"></span>
          </ng-template>
          <button nz-button nz-dropdown [nzDropdownMenu]="categoryMenu">
            <span nz-icon nzType="appstore" nzTheme="outline"></span>
            分類
          </button>
          <nz-dropdown-menu #categoryMenu="nzDropdownMenu">
            <ul nz-menu>
              <li nz-menu-item (click)="filterByCategory(null)">全部連結</li>
              <li nz-menu-item (click)="filterByCategory('document')">文件</li>
              <li nz-menu-item (click)="filterByCategory('design')">設計</li>
              <li nz-menu-item (click)="filterByCategory('reference')">參考</li>
              <li nz-menu-item (click)="filterByCategory('other')">其他</li>
            </ul>
          </nz-dropdown-menu>
        </div>
      </div>

      <div class="category-tabs">
        @for (cat of categories; track cat.value) {
          <button
            nz-button
            [nzType]="selectedCategory() === cat.value ? 'primary' : 'default'"
            (click)="filterByCategory(cat.value)"
          >
            {{ cat.label }} ({{ getCategoryCount(cat.value) }})
          </button>
        }
      </div>

      @if (filteredLinks().length > 0) {
        <div class="link-grid">
          @for (link of filteredLinks(); track link.id) {
            <nz-card
              class="link-card"
              [nzBorderless]="false"
              [class.invalid]="!link.isValid"
            >
              <div class="link-header">
                <div class="link-favicon">
                  @if (link.faviconUrl) {
                    <img [src]="link.faviconUrl" alt="favicon" />
                  } @else {
                    <span nz-icon nzType="link" nzTheme="outline"></span>
                  }
                </div>
                <div class="link-meta">
                  <span class="site-name">{{ link.siteName }}</span>
                  <nz-tag [nzColor]="getCategoryColor(link.category)" class="category-tag">
                    {{ getCategoryLabel(link.category) }}
                  </nz-tag>
                </div>
                <button
                  nz-button
                  nzType="text"
                  nzSize="small"
                  nz-dropdown
                  [nzDropdownMenu]="actionMenu"
                  class="action-btn"
                >
                  <span nz-icon nzType="more" nzTheme="outline"></span>
                </button>
                <nz-dropdown-menu #actionMenu="nzDropdownMenu">
                  <ul nz-menu>
                    <li nz-menu-item>
                      <span nz-icon nzType="edit" nzTheme="outline"></span>
                      編輯
                    </li>
                    <li nz-menu-item>
                      <span nz-icon nzType="copy" nzTheme="outline"></span>
                      複製連結
                    </li>
                    <li nz-menu-item nzDanger>
                      <span nz-icon nzType="delete" nzTheme="outline"></span>
                      刪除
                    </li>
                  </ul>
                </nz-dropdown-menu>
              </div>

              <a
                class="link-title"
                [href]="link.url"
                target="_blank"
                rel="noopener noreferrer"
                [nz-tooltip]="link.url"
              >
                {{ link.title }}
                <span nz-icon nzType="link" nzTheme="outline" class="external-icon"></span>
              </a>

              <p class="link-description">{{ link.description }}</p>

              @if (!link.isValid) {
                <div class="invalid-notice">
                  <span nz-icon nzType="warning" nzTheme="outline"></span>
                  連結可能已失效
                </div>
              }

              <div class="link-footer">
                <span class="created-by">{{ link.createdBy.name }}</span>
                <span class="created-at">{{ formatDate(link.createdAt) }}</span>
              </div>
            </nz-card>
          }
        </div>
      } @else {
        <nz-empty
          nzNotFoundImage="simple"
          nzNotFoundContent="尚無外部連結"
        >
          <ng-template #nzNotFoundFooter>
            <button nz-button nzType="primary">
              <span nz-icon nzType="plus" nzTheme="outline"></span>
              新增連結
            </button>
          </ng-template>
        </nz-empty>
      }

      <div class="statistics">
        <div class="stat-item">
          <span class="stat-label">總連結數</span>
          <span class="stat-value">{{ links().length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">有效連結</span>
          <span class="stat-value">{{ validLinkCount() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">失效連結</span>
          <span class="stat-value invalid-count">{{ invalidLinkCount() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .link-list-skeleton {
      padding: 16px;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .toolbar-right {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .category-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .link-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .link-card {
      transition: box-shadow 0.2s;
    }

    .link-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .link-card.invalid {
      border-color: #faad14;
      background: #fffbe6;
    }

    .link-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .link-favicon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .link-favicon img {
      width: 16px;
      height: 16px;
    }

    .link-meta {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .site-name {
      font-size: 12px;
      color: #666;
    }

    .category-tag {
      font-size: 10px;
    }

    .action-btn {
      opacity: 0;
      transition: opacity 0.2s;
    }

    .link-card:hover .action-btn {
      opacity: 1;
    }

    .link-title {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #1890ff;
      margin-bottom: 8px;
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .link-title:hover {
      text-decoration: underline;
    }

    .external-icon {
      font-size: 10px;
      margin-left: 4px;
      opacity: 0.5;
    }

    .link-description {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .invalid-notice {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #faad14;
      margin-bottom: 8px;
    }

    .link-footer {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #999;
      padding-top: 8px;
      border-top: 1px solid #f0f0f0;
    }

    .statistics {
      display: flex;
      gap: 24px;
      margin-top: 16px;
      padding: 12px 16px;
      background: #fafafa;
      border-radius: 4px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }

    .stat-value.invalid-count {
      color: #faad14;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkListSkeletonComponent {
  protected readonly links = signal<ExternalLink[]>(MOCK_LINKS);
  protected readonly selectedCategory = signal<LinkCategory | null>(null);

  protected readonly categories: Array<{ value: LinkCategory | null; label: string }> = [
    { value: null, label: '全部' },
    { value: 'document', label: '文件' },
    { value: 'design', label: '設計' },
    { value: 'reference', label: '參考' },
    { value: 'other', label: '其他' }
  ];

  protected readonly filteredLinks = computed(() => {
    const category = this.selectedCategory();
    if (!category) return this.links();
    return this.links().filter(l => l.category === category);
  });

  protected readonly validLinkCount = computed(() =>
    this.links().filter(l => l.isValid).length
  );

  protected readonly invalidLinkCount = computed(() =>
    this.links().filter(l => !l.isValid).length
  );

  protected filterByCategory(category: LinkCategory | null): void {
    this.selectedCategory.set(category);
  }

  protected getCategoryCount(category: LinkCategory | null): number {
    if (!category) return this.links().length;
    return this.links().filter(l => l.category === category).length;
  }

  protected getCategoryColor(category: LinkCategory): string {
    const colors: Record<LinkCategory, string> = {
      document: 'blue',
      design: 'purple',
      reference: 'green',
      other: 'default'
    };
    return colors[category] || 'default';
  }

  protected getCategoryLabel(category: LinkCategory): string {
    const labels: Record<LinkCategory, string> = {
      document: '文件',
      design: '設計',
      reference: '參考',
      other: '其他'
    };
    return labels[category] || '其他';
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}
