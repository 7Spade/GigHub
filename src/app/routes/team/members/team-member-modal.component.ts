import { Component, inject, input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { TeamRole } from '@core';

/**
 * Team Member Modal Component
 * 團隊成員 Modal 元件 - 用於新增團隊成員
 * 
 * Features:
 * - Add new member to team
 * - Select user and role
 * - Form validation
 * 
 * ✅ Modern Angular pattern with Reactive Forms
 */
@Component({
  selector: 'app-team-member-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>使用者 ID</nz-form-label>
        <nz-form-control [nzSpan]="18" nzErrorTip="請輸入使用者 ID">
          <input 
            nz-input 
            formControlName="userId" 
            placeholder="請輸入要新增的使用者 ID" 
          />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>角色</nz-form-label>
        <nz-form-control [nzSpan]="18" nzErrorTip="請選擇角色">
          <nz-select formControlName="role" nzPlaceHolder="請選擇角色">
            <nz-option [nzValue]="TeamRole.MEMBER" nzLabel="成員"></nz-option>
            <nz-option [nzValue]="TeamRole.ADMIN" nzLabel="管理員"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>
      
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="提示"
        nzDescription="請確保輸入的使用者 ID 存在於系統中"
        class="mt-md"
      />
    </form>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TeamMemberModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  
  // Expose TeamRole for template
  readonly TeamRole = TeamRole;
  
  form: FormGroup = this.fb.group({
    userId: ['', [Validators.required, Validators.minLength(1)]],
    role: [TeamRole.MEMBER, [Validators.required]]
  });
  
  ngOnInit(): void {
    // Initialization if needed
  }
  
  /**
   * Get form data
   * ModalHelper will call this method
   */
  getData(): { userId: string; role: TeamRole } {
    if (!this.form.valid) {
      throw new Error('Form is invalid');
    }
    
    return {
      userId: this.form.value.userId.trim(),
      role: this.form.value.role
    };
  }
  
  /**
   * Check if form is valid
   */
  isValid(): boolean {
    return this.form.valid;
  }
}
