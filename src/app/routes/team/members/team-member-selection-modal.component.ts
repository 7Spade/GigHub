import { Component, inject, input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';
import { TeamRole, OrganizationMember } from '@core';

/**
 * Team Member Selection Modal Component
 * 團隊成員選擇 Modal 元件 - 用於從組織成員中選擇並新增至團隊
 * 
 * Features:
 * - Select member from available organization members
 * - Select member role (LEADER or MEMBER)
 * - Form validation
 * 
 * ✅ Modern Angular 20 pattern:
 * - Standalone component
 * - Signals with input() function
 * - Reactive forms
 * - New control flow syntax (@if, @for)
 * - inject() for dependency injection
 */
@Component({
  selector: 'app-team-member-selection-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>選擇成員</nz-form-label>
        <nz-form-control [nzSpan]="18" nzErrorTip="請選擇成員">
          <nz-select 
            formControlName="userId" 
            nzPlaceHolder="請選擇要加入的成員"
            nzShowSearch
            [nzFilterOption]="filterOption"
          >
            @for (member of availableMembers(); track member.user_id) {
              <nz-option 
                [nzValue]="member.user_id" 
                [nzLabel]="member.user_id"
              ></nz-option>
            }
          </nz-select>
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>角色</nz-form-label>
        <nz-form-control [nzSpan]="18" nzErrorTip="請選擇角色">
          <nz-select formControlName="role" nzPlaceHolder="請選擇角色">
            <nz-option [nzValue]="TeamRole.MEMBER" nzLabel="團隊成員"></nz-option>
            <nz-option [nzValue]="TeamRole.LEADER" nzLabel="團隊領導"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>
      
      <nz-alert
        nzType="info"
        nzShowIcon
        nzMessage="提示"
        nzDescription="選擇一位組織成員加入此團隊，並指定其角色"
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
export class TeamMemberSelectionModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  
  /**
   * Input: Available organization members to select from
   * 可選的組織成員列表
   */
  availableMembers = input.required<OrganizationMember[]>();
  
  /** Expose TeamRole enum for template */
  readonly TeamRole = TeamRole;
  
  /**
   * Reactive form for member selection
   * 成員選擇表單
   */
  form: FormGroup = this.fb.group({
    userId: ['', [Validators.required]],
    role: [TeamRole.MEMBER, [Validators.required]]
  });
  
  ngOnInit(): void {
    // Set default value if only one member available
    const members = this.availableMembers();
    if (members.length === 1) {
      this.form.patchValue({ userId: members[0].user_id });
    }
  }
  
  /**
   * Filter function for nz-select search
   * 搜尋過濾函式
   */
  filterOption = (input: string, option: any): boolean => {
    const userId = option.nzValue?.toLowerCase() || '';
    return userId.includes(input.toLowerCase());
  };
  
  /**
   * Get form data
   * Called by ModalHelper or modal service
   * 
   * @returns Form data with userId and role
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
   * Called by ModalHelper or modal service
   * 
   * @returns True if form is valid
   */
  isValid(): boolean {
    return this.form.valid;
  }
}
