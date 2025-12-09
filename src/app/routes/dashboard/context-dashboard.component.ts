import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Data } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContextType } from '@core';
import { SHARED_IMPORTS, WorkspaceContextService } from '@shared';
import { HeaderContextSwitcherComponent } from '../../layout/basic/widgets/context-switcher.component';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzAlertModule } from 'ng-zorro-antd/alert';

interface SummaryCard {
  title: string;
  value: string;
  description: string;
}

@Component({
  selector: 'app-context-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS, NzMenuModule, NzAlertModule, HeaderContextSwitcherComponent],
  template: `
    <page-header [title]="pageTitle()" [desc]="pageDescription()"></page-header>

    @if (!contextMatched()) {
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="目前上下文與頁面不一致"
        nzDescription="請使用下方的工作區切換器切換到對應的使用者、組織或團隊。"
        class="mb-md"
      />
    }

    <nz-card class="mb-md" nzTitle="工作區切換">
      <div class="text-grey mb-sm">快速切換工作區，檢視對應儀錶盤。</div>
      <ul nz-menu nzMode="inline" class="bg-transparent border-0">
        <header-context-switcher />
      </ul>
    </nz-card>

    <nz-card nzTitle="概覽">
      <div nz-row nzGutter="16">
        @for (card of summaryCards(); track card.title) {
          <div nz-col nzXs="24" nzSm="12" nzMd="8" class="mb-md">
            <nz-card [nzTitle]="card.title" nzBordered="true">
              <div class="h2 mt0 mb-sm">{{ card.value }}</div>
              <div class="text-grey">{{ card.description }}</div>
            </nz-card>
          </div>
        }
      </div>
    </nz-card>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .bg-transparent {
        background: transparent;
      }
      .border-0 {
        border: 0;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextDashboardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly workspaceContext = inject(WorkspaceContextService);

  private readonly routeData = toSignal(this.route.data, { initialValue: {} as Data });

  readonly requestedContext = computed<ContextType | undefined>(() => {
    const context = this.routeData()['context'] as ContextType | undefined;
    return context;
  });

  readonly pageTitle = computed(() => {
    switch (this.requestedContext()) {
      case ContextType.ORGANIZATION:
        return '組織儀錶盤';
      case ContextType.TEAM:
        return '團隊儀錶盤';
      case ContextType.USER:
      default:
        return '個人儀錶盤';
    }
  });

  readonly pageDescription = computed(() => {
    switch (this.requestedContext()) {
      case ContextType.ORGANIZATION:
        return '檢視組織狀態並管理跨團隊協作。';
      case ContextType.TEAM:
        return '追蹤團隊進度、成員分工與交付節點。';
      case ContextType.USER:
      default:
        return '掌握個人待辦、近期活動與通知。';
    }
  });

  readonly contextMatched = computed(() => {
    const requested = this.requestedContext();
    return requested ? requested === this.workspaceContext.contextType() : true;
  });

  readonly summaryCards = computed<SummaryCard[]>(() => {
    const context = this.requestedContext() ?? this.workspaceContext.contextType();
    const label = this.workspaceContext.contextLabel();
    const icon = this.workspaceContext.contextIcon();
    const baseCards: SummaryCard[] = [
      {
        title: '目前工作區',
        value: label,
        description: `目前選擇的 ${this.readableContext(context)}。`
      },
      {
        title: '切換器狀態',
        value: icon,
        description: '可從左側菜單或本頁切換器快速切換。'
      },
      {
        title: '組織數量',
        value: `${this.workspaceContext.organizations().length}`,
        description: '已載入的組織數量，便於跨組織協作。'
      }
    ];

    if (context === ContextType.ORGANIZATION) {
      baseCards.push({
        title: '團隊數量',
        value: `${this.workspaceContext.teams().length}`,
        description: '組織底下的團隊總數。'
      });
    }

    return baseCards;
  });

  private readableContext(context: ContextType): string {
    switch (context) {
      case ContextType.ORGANIZATION:
        return '組織';
      case ContextType.TEAM:
        return '團隊';
      case ContextType.USER:
      default:
        return '個人帳戶';
    }
  }
}
