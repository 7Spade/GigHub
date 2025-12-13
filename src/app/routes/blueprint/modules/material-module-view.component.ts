/**
 * Material Module View Component
 * 材料域視圖元件
 */

import { Component, ChangeDetectionStrategy, OnInit, inject, input } from '@angular/core';
import { ConsumptionService } from '@core/blueprint/modules/implementations/material/services/consumption.service';
import { EquipmentService } from '@core/blueprint/modules/implementations/material/services/equipment.service';
import { InventoryService } from '@core/blueprint/modules/implementations/material/services/inventory.service';
import { MaterialIssueService } from '@core/blueprint/modules/implementations/material/services/material-issue.service';
import { MaterialManagementService } from '@core/blueprint/modules/implementations/material/services/material-management.service';
import { STColumn } from '@delon/abc/st';
import { SHARED_IMPORTS } from '@shared';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-material-module-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzStatisticModule, NzEmptyModule],
  template: `
    <nz-card nzTitle="材料統計" class="mb-md">
      <nz-row [nzGutter]="16">
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="materialService.data().length" nzTitle="材料項目" />
        </nz-col>
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="inventoryService.data().length" nzTitle="庫存" />
        </nz-col>
        <nz-col [nzSpan]="8">
          <nz-statistic [nzValue]="equipmentService.data().length" nzTitle="設備資產" />
        </nz-col>
      </nz-row>
    </nz-card>

    <nz-card>
      <nz-tabset>
        <nz-tab nzTitle="材料管理">
          @if (materialService.loading()) {
            <nz-spin nzSimple />
          } @else if (materialService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無材料記錄" />
          } @else {
            <st [data]="materialService.data()" [columns]="materialColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="領用記錄">
          @if (issueService.loading()) {
            <nz-spin nzSimple />
          } @else if (issueService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無領用記錄" />
          } @else {
            <st [data]="issueService.data()" [columns]="issueColumns" />
          }
        </nz-tab>
        <nz-tab nzTitle="出入庫">
          @if (inventoryService.loading()) {
            <nz-spin nzSimple />
          } @else if (inventoryService.data().length === 0) {
            <nz-empty nzNotFoundContent="暫無庫存記錄" />
          } @else {
            <st [data]="inventoryService.data()" [columns]="inventoryColumns" />
          }
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: []
})
export class MaterialModuleViewComponent implements OnInit {
  blueprintId = input.required<string>();

  readonly materialService = inject(MaterialManagementService);
  readonly issueService = inject(MaterialIssueService);
  readonly inventoryService = inject(InventoryService);
  readonly equipmentService = inject(EquipmentService);
  readonly consumptionService = inject(ConsumptionService);

  materialColumns: STColumn[] = [
    { title: '材料名稱', index: 'name' },
    { title: '規格', index: 'spec', width: '150px' },
    { title: '數量', index: 'quantity', width: '100px' }
  ];

  issueColumns: STColumn[] = [
    { title: '材料', index: 'material' },
    { title: '數量', index: 'quantity', width: '100px' },
    { title: '領用人', index: 'issuer', width: '120px' },
    { title: '時間', index: 'issuedAt', type: 'date', width: '180px' }
  ];

  inventoryColumns: STColumn[] = [
    { title: '項目', index: 'item' },
    { title: '庫存量', index: 'stock', width: '100px' },
    { title: '單位', index: 'unit', width: '80px' }
  ];

  ngOnInit(): void {
    this.materialService.load();
    this.issueService.load();
    this.inventoryService.load();
    this.equipmentService.load();
    this.consumptionService.load();
  }
}
