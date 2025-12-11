/**
 * Create Team Component - Modern Angular 20 Implementation
 *
 * 建立團隊組件 - 現代化 Angular 20 實作
 * Create team component - Modern Angular 20 implementation
 *
 * Allows users to create a new team within an organization.
 * Integrates with WorkspaceContextService for state management.
 *
 * Modern Angular 20 Patterns:
 * - Standalone Component
 * - Signals for state management
 * - input() function for inputs (Angular 19+)
 * - Reactive Forms with proper validation
 * - OnPush change detection
 *
 * @module shared/components
 */

import { ChangeDetectionStrategy, Component, inject, signal, input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Team } from '@core';
import { TeamRepository } from '@core/repositories';
import { WorkspaceContextService } from '@shared';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-create-team',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule],
  template: `
    <div class="modal-header">
      <div class="modal-title">建立團隊</div>
    </div>

    <div class="modal-body">
      <form nz-form [formGroup]="form" nzLayout="vertical">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">團隊名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="nameErrorTip">
            <input nz-input formControlName="name" placeholder="請輸入團隊名稱（2-50個字符）" [disabled]="loading()" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>描述</nz-form-label>
          <nz-form-control>
            <textarea
              nz-input
              formControlName="description"
              placeholder="請輸入團隊描述（選填）"
              [disabled]="loading()"
              rows="3"
            ></textarea>
          </nz-form-control>
        </nz-form-item>
      </form>
    </div>

    <div class="modal-footer">
      <button nz-button type="button" (click)="cancel()" [disabled]="loading()">取消</button>
      <button nz-button type="button" nzType="primary" (click)="submit()" [nzLoading]="loading()" [disabled]="form.invalid">
        建立團隊
      </button>
    </div>
  `,
  styles: [
    `
      .modal-header {
        padding: 16px 24px;
        border-bottom: 1px solid #f0f0f0;
      }
      .modal-title {
        font-size: 16px;
        font-weight: 500;
      }
      .modal-body {
        padding: 24px;
      }
      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid #f0f0f0;
        text-align: right;
      }
      .modal-footer button + button {
        margin-left: 8px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTeamComponent {
  // Use input() function (Angular 19+ modern pattern) instead of @Input()
  organizationId = input<string>(); // Optional: organization to create team in

  private readonly fb = inject(FormBuilder);
  private readonly workspaceContext = inject(WorkspaceContextService);
  private readonly teamRepository = inject(TeamRepository);
  private readonly modal = inject(NzModalRef);
  private readonly msg = inject(NzMessageService);

  loading = signal(false);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(500)]]
  });

  get nameErrorTip(): string {
    const nameControl = this.form.get('name');
    if (nameControl?.hasError('required')) {
      return '請輸入團隊名稱';
    }
    if (nameControl?.hasError('minlength')) {
      return '團隊名稱至少需要 2 個字符';
    }
    if (nameControl?.hasError('maxlength')) {
      return '團隊名稱最多 50 個字符';
    }
    return '';
  }

  cancel(): void {
    this.modal.destroy();
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      // Mark all fields as touched to show validation errors
      Object.values(this.form.controls).forEach(control => {
        control.markAsTouched();
        control.updateValueAndValidity();
      });
      return;
    }

    const orgId = this.organizationId();
    if (!orgId) {
      this.msg.error('請先選擇組織');
      return;
    }

    this.loading.set(true);
    try {
      // Create team in Firestore
      const newTeam = await this.teamRepository.create({
        organization_id: orgId,
        name: this.form.value.name.trim(),
        description: this.form.value.description?.trim() || null
      });

      // Add to workspace context
      this.workspaceContext.addTeam(newTeam);

      // Switch to new team context
      this.workspaceContext.switchToTeam(newTeam.id);

      this.msg.success('團隊建立成功！');
      this.modal.destroy(newTeam);
    } catch (error) {
      console.error('[CreateTeamComponent] ❌ Create team failed:', error);
      this.msg.error('建立團隊失敗，請稍後再試');
      this.loading.set(false);
    }
  }
}
