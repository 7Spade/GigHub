import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header [title]="'個人設定'" [content]="headerContent" [breadcrumb]="breadcrumb"></page-header>

    <ng-template #breadcrumb>
      <nz-breadcrumb>
        <nz-breadcrumb-item>
          <a routerLink="/">
            <span nz-icon nzType="home"></span>
            首頁
          </a>
        </nz-breadcrumb-item>
        <nz-breadcrumb-item>個人設定</nz-breadcrumb-item>
      </nz-breadcrumb>
    </ng-template>

    <ng-template #headerContent>
      <div>管理通知與偏好設定。</div>
    </ng-template>

    <nz-card>
      <form nz-form [formGroup]="form" nzLayout="vertical" (ngSubmit)="save()">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">顯示名稱</nz-form-label>
          <nz-form-control [nzErrorTip]="'請輸入 2-50 字元的顯示名稱'">
            <input nz-input formControlName="displayName" placeholder="輸入顯示名稱" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>語言</nz-form-label>
          <nz-form-control>
            <nz-select formControlName="language" nzPlaceHolder="選擇介面語言">
              <nz-option nzLabel="繁體中文" nzValue="zh-TW"></nz-option>
              <nz-option nzLabel="English" nzValue="en-US"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label>通知偏好</nz-form-label>
          <nz-form-control>
            <label nz-checkbox formControlName="emailUpdates">重要更新 Email 通知</label>
            <br />
            <label nz-checkbox formControlName="weeklySummary">每週摘要推播</label>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control>
            <button nz-button nzType="primary" [nzLoading]="saving()" [disabled]="form.invalid"> 儲存設定 </button>
          </nz-form-control>
        </nz-form-item>
      </form>
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  saving = signal(false);

  form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    language: ['zh-TW', [Validators.required]],
    emailUpdates: [true],
    weeklySummary: [true]
  });

  save(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    this.saving.set(true);
    setTimeout(() => {
      const displayName = this.form.value.displayName;
      const language = this.form.value.language;
      this.message.success(`已更新「${displayName}」的設定（語言：${language}）`);
      this.saving.set(false);
    }, 300);
  }
}
