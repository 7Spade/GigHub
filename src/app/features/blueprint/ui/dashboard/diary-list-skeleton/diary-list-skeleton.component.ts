import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

// 施工日誌狀態
type DiaryStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

// 天氣類型
type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'stormy';

// 施工日誌介面
interface ConstructionDiary {
  id: string;
  workDate: string;
  weather: WeatherType;
  temperature: number;
  workSummary: string;
  workerCount: number;
  workHours: number;
  status: DiaryStatus;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Mock 資料
const MOCK_DIARIES: ConstructionDiary[] = [
  {
    id: '1',
    workDate: '2025-11-27',
    weather: 'sunny',
    temperature: 22,
    workSummary: '完成基礎開挖作業，進度正常',
    workerCount: 15,
    workHours: 8,
    status: 'approved',
    createdBy: { id: '1', name: '王主任' },
    createdAt: '2025-11-27T18:00:00Z',
    updatedAt: '2025-11-27T18:00:00Z'
  },
  {
    id: '2',
    workDate: '2025-11-26',
    weather: 'cloudy',
    temperature: 18,
    workSummary: '鋼筋綁紮作業，完成 80%',
    workerCount: 12,
    workHours: 8,
    status: 'approved',
    createdBy: { id: '1', name: '王主任' },
    createdAt: '2025-11-26T18:00:00Z',
    updatedAt: '2025-11-26T18:00:00Z'
  },
  {
    id: '3',
    workDate: '2025-11-25',
    weather: 'rainy',
    temperature: 15,
    workSummary: '因雨停工，進行室內整理作業',
    workerCount: 5,
    workHours: 4,
    status: 'approved',
    createdBy: { id: '2', name: '李工程師' },
    createdAt: '2025-11-25T18:00:00Z',
    updatedAt: '2025-11-25T18:00:00Z'
  },
  {
    id: '4',
    workDate: '2025-11-28',
    weather: 'sunny',
    temperature: 20,
    workSummary: '今日施工作業紀錄',
    workerCount: 18,
    workHours: 8,
    status: 'draft',
    createdBy: { id: '1', name: '王主任' },
    createdAt: '2025-11-28T10:00:00Z',
    updatedAt: '2025-11-28T10:00:00Z'
  }
];

@Component({
  selector: 'app-diary-list-skeleton',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzButtonModule, NzIconModule, NzTagModule, NzDropDownModule, NzToolTipModule, NzEmptyModule],
  template: `
    <div class="diary-list-skeleton">
      <div class="toolbar">
        <div class="toolbar-left">
          <button nz-button nzType="primary">
            <span nz-icon nzType="plus" nzTheme="outline"></span>
            新增日誌
          </button>
        </div>
        <div class="toolbar-right">
          <button nz-button nz-dropdown [nzDropdownMenu]="filterMenu">
            <span nz-icon nzType="filter" nzTheme="outline"></span>
            篩選
          </button>
          <nz-dropdown-menu #filterMenu="nzDropdownMenu">
            <ul nz-menu>
              <li nz-menu-item>全部日誌</li>
              <li nz-menu-item>草稿</li>
              <li nz-menu-item>已提交</li>
              <li nz-menu-item>已核准</li>
            </ul>
          </nz-dropdown-menu>
        </div>
      </div>

      @if (diaries().length > 0) {
        <nz-table #diaryTable [nzData]="diaries()" [nzPageSize]="10" [nzShowSizeChanger]="true" nzSize="middle">
          <thead>
            <tr>
              <th nzWidth="120px">施工日期</th>
              <th nzWidth="100px">天氣</th>
              <th>工作摘要</th>
              <th nzWidth="100px">施工人數</th>
              <th nzWidth="100px">工時</th>
              <th nzWidth="100px">狀態</th>
              <th nzWidth="120px">填寫人</th>
              <th nzWidth="80px">操作</th>
            </tr>
          </thead>
          <tbody>
            @for (diary of diaryTable.data; track diary.id) {
              <tr>
                <td>{{ diary.workDate }}</td>
                <td>
                  <span [nz-tooltip]="getWeatherLabel(diary.weather)"> {{ getWeatherIcon(diary.weather) }} {{ diary.temperature }}°C </span>
                </td>
                <td class="summary-cell">{{ diary.workSummary }}</td>
                <td>{{ diary.workerCount }} 人</td>
                <td>{{ diary.workHours }} 小時</td>
                <td>
                  <nz-tag [nzColor]="getStatusColor(diary.status)">
                    {{ getStatusLabel(diary.status) }}
                  </nz-tag>
                </td>
                <td>{{ diary.createdBy.name }}</td>
                <td>
                  <button nz-button nzType="text" nzSize="small" nz-dropdown [nzDropdownMenu]="actionMenu">
                    <span nz-icon nzType="more" nzTheme="outline"></span>
                  </button>
                  <nz-dropdown-menu #actionMenu="nzDropdownMenu">
                    <ul nz-menu>
                      <li nz-menu-item>
                        <span nz-icon nzType="eye" nzTheme="outline"></span>
                        檢視
                      </li>
                      @if (diary.status === 'draft') {
                        <li nz-menu-item>
                          <span nz-icon nzType="edit" nzTheme="outline"></span>
                          編輯
                        </li>
                        <li nz-menu-item>
                          <span nz-icon nzType="send" nzTheme="outline"></span>
                          提交審核
                        </li>
                      }
                    </ul>
                  </nz-dropdown-menu>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      } @else {
        <nz-empty nzNotFoundImage="simple" nzNotFoundContent="尚無施工日誌">
          <ng-template #nzNotFoundFooter>
            <button nz-button nzType="primary">
              <span nz-icon nzType="plus" nzTheme="outline"></span>
              新增日誌
            </button>
          </ng-template>
        </nz-empty>
      }

      <div class="statistics">
        <div class="stat-item">
          <span class="stat-label">本月日誌</span>
          <span class="stat-value">{{ monthlyCount() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">累計工時</span>
          <span class="stat-value">{{ totalWorkHours() }} 小時</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均人數</span>
          <span class="stat-value">{{ averageWorkers() }} 人</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .diary-list-skeleton {
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
      }

      .summary-cell {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiaryListSkeletonComponent {
  protected readonly diaries = signal<ConstructionDiary[]>(MOCK_DIARIES);

  protected readonly monthlyCount = computed(() => this.diaries().length);

  protected readonly totalWorkHours = computed(() => this.diaries().reduce((sum, d) => sum + d.workHours, 0));

  protected readonly averageWorkers = computed(() => {
    const diaries = this.diaries();
    if (diaries.length === 0) return 0;
    const total = diaries.reduce((sum, d) => sum + d.workerCount, 0);
    return Math.round(total / diaries.length);
  });

  protected getWeatherIcon(weather: WeatherType): string {
    const icons: Record<WeatherType, string> = {
      sunny: '☀️',
      cloudy: '⛅',
      rainy: '🌧️',
      stormy: '⛈️'
    };
    return icons[weather] || '☀️';
  }

  protected getWeatherLabel(weather: WeatherType): string {
    const labels: Record<WeatherType, string> = {
      sunny: '晴天',
      cloudy: '多雲',
      rainy: '雨天',
      stormy: '暴風'
    };
    return labels[weather] || '未知';
  }

  protected getStatusColor(status: DiaryStatus): string {
    const colors: Record<DiaryStatus, string> = {
      draft: 'default',
      submitted: 'processing',
      approved: 'success',
      rejected: 'error'
    };
    return colors[status] || 'default';
  }

  protected getStatusLabel(status: DiaryStatus): string {
    const labels: Record<DiaryStatus, string> = {
      draft: '草稿',
      submitted: '審核中',
      approved: '已核准',
      rejected: '已退回'
    };
    return labels[status] || '未知';
  }
}
