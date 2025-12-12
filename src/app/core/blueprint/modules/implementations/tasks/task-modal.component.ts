/**
 * Task Modal Component
 * 任務模態框元件
 *
 * Features:
 * - Create/Edit/View tasks
 * - Form validation
 * - Reactive Forms integration
 *
 * ✅ Uses ng-zorro-antd modal and form
 * ✅ Uses Angular 20 Signals and modern syntax
 * ✅ Follows ConstructionLogModalComponent pattern
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskStore } from '@core/stores/task.store';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from '@core/types/task';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzSliderModule } from 'ng-zorro-antd/slider';
interface ModalData {
  blueprintId: string;
  task?: Task;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [SHARED_IMPORTS, NzSliderModule],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <!-- Title -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>標題</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="請輸入任務標題">
          <input nz-input formControlName="title" placeholder="例如：混凝土澆築" />
        </nz-form-control>
      </nz-form-item>

      <!-- Description -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">描述</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <textarea nz-input formControlName="description" [nzAutosize]="{ minRows: 3, maxRows: 6 }" placeholder="任務詳細描述"></textarea>
        </nz-form-control>
      </nz-form-item>

      <!-- Status -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">狀態</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-select formControlName="status" nzPlaceHolder="選擇狀態" style="width: 100%;">
            <nz-option [nzValue]="TaskStatus.PENDING" nzLabel="待處理"></nz-option>
            <nz-option [nzValue]="TaskStatus.IN_PROGRESS" nzLabel="進行中"></nz-option>
            <nz-option [nzValue]="TaskStatus.ON_HOLD" nzLabel="暫停"></nz-option>
            <nz-option [nzValue]="TaskStatus.COMPLETED" nzLabel="已完成"></nz-option>
            <nz-option [nzValue]="TaskStatus.CANCELLED" nzLabel="已取消"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- Priority -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">優先級</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-select formControlName="priority" nzPlaceHolder="選擇優先級" style="width: 100%;">
            <nz-option [nzValue]="TaskPriority.LOW" nzLabel="低"></nz-option>
            <nz-option [nzValue]="TaskPriority.MEDIUM" nzLabel="中"></nz-option>
            <nz-option [nzValue]="TaskPriority.HIGH" nzLabel="高"></nz-option>
            <nz-option [nzValue]="TaskPriority.CRITICAL" nzLabel="緊急"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- Assignee Name -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">負責人</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <input nz-input formControlName="assigneeName" placeholder="輸入負責人姓名" />
        </nz-form-control>
      </nz-form-item>

      <!-- Due Date -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">到期日</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-date-picker formControlName="dueDate" nzFormat="yyyy-MM-dd" style="width: 100%;" />
        </nz-form-control>
      </nz-form-item>

      <!-- Start Date -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">開始日期</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-date-picker formControlName="startDate" nzFormat="yyyy-MM-dd" style="width: 100%;" />
        </nz-form-control>
      </nz-form-item>

      <!-- Estimated Hours -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">預估工時</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-input-number formControlName="estimatedHours" [nzMin]="0" [nzMax]="1000" [nzStep]="0.5" style="width: 100%;" />
          <span style="margin-left: 8px;">小時</span>
        </nz-form-control>
      </nz-form-item>

      <!-- Progress -->
      @if (modalData.mode !== 'create') {
        <nz-form-item>
          <nz-form-label [nzSpan]="6">進度</nz-form-label>
          <nz-form-control [nzSpan]="14">
            <nz-slider formControlName="progress" [nzMin]="0" [nzMax]="100" [nzStep]="5" [nzMarks]="progressMarks" />
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Tags -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">標籤</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-select formControlName="tags" nzMode="tags" nzPlaceHolder="輸入標籤後按Enter" style="width: 100%;"> </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- Form Actions -->
      <nz-form-item>
        <nz-form-control [nzSpan]="14" [nzOffset]="6">
          <button nz-button nzType="default" (click)="cancel()" style="margin-right: 8px;"> 取消 </button>
          @if (modalData.mode !== 'view') {
            <button nz-button nzType="primary" type="submit" [nzLoading]="submitting()" [disabled]="!form.valid">
              {{ modalData.mode === 'create' ? '新增' : '更新' }}
            </button>
          }
        </nz-form-control>
      </nz-form-item>
    </form>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class TaskModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private taskStore = inject(TaskStore);

  // Modal data injected
  modalData: ModalData = inject(NZ_MODAL_DATA);

  // Make enums available to template
  readonly TaskStatus = TaskStatus;
  readonly TaskPriority = TaskPriority;

  // Form
  form!: FormGroup;

  // State
  submitting = signal(false);

  // Progress marks
  readonly progressMarks = {
    0: '0%',
    25: '25%',
    50: '50%',
    75: '75%',
    100: '100%'
  };

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const task = this.modalData.task;
    const isView = this.modalData.mode === 'view';

    this.form = this.fb.group({
      title: [{ value: task?.title || '', disabled: isView }, [Validators.required, Validators.maxLength(100)]],
      description: [{ value: task?.description || '', disabled: isView }, [Validators.maxLength(1000)]],
      status: [{ value: task?.status || TaskStatus.PENDING, disabled: isView || this.modalData.mode === 'create' }],
      priority: [{ value: task?.priority || TaskPriority.MEDIUM, disabled: isView }],
      assigneeName: [{ value: task?.assigneeName || '', disabled: isView }],
      dueDate: [{ value: task?.dueDate ? new Date(task.dueDate as any) : null, disabled: isView }],
      startDate: [{ value: task?.startDate ? new Date(task.startDate as any) : null, disabled: isView }],
      estimatedHours: [{ value: task?.estimatedHours || null, disabled: isView }],
      progress: [{ value: task?.progress ?? 0, disabled: isView }, [Validators.min(0), Validators.max(100)]],
      tags: [{ value: task?.tags || [], disabled: isView }]
    });
  }

  async submit(): Promise<void> {
    if (!this.form.valid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.submitting.set(true);

    try {
      const formValue = this.form.value;

      if (this.modalData.mode === 'create') {
        await this.createTask(formValue);
      } else if (this.modalData.mode === 'edit') {
        await this.updateTask(formValue);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      this.message.error('操作失敗');
    } finally {
      this.submitting.set(false);
    }
  }

  private async createTask(formValue: any): Promise<void> {
    const createData: CreateTaskRequest = {
      title: formValue.title,
      description: formValue.description,
      priority: formValue.priority || TaskPriority.MEDIUM,
      assigneeName: formValue.assigneeName || undefined,
      assigneeId: undefined, // TODO: Get from user selection if needed
      dueDate: formValue.dueDate || undefined,
      startDate: formValue.startDate || undefined,
      estimatedHours: formValue.estimatedHours || undefined,
      tags: formValue.tags || [],
      creatorId: 'current-user' // TODO: Get from auth service
    };

    const newTask = await this.taskStore.createTask(this.modalData.blueprintId, createData);

    if (!newTask) {
      throw new Error('Failed to create task');
    }

    this.message.success('任務新增成功');
    this.modalRef.close({ success: true, task: newTask });
  }

  private async updateTask(formValue: any): Promise<void> {
    const taskId = this.modalData.task?.id;
    if (!taskId) {
      throw new Error('Task ID not found');
    }

    const updateData: UpdateTaskRequest = {
      title: formValue.title,
      description: formValue.description,
      status: formValue.status,
      priority: formValue.priority,
      assigneeName: formValue.assigneeName || undefined,
      assigneeId: undefined, // TODO: Get from user selection if needed
      dueDate: formValue.dueDate || undefined,
      startDate: formValue.startDate || undefined,
      estimatedHours: formValue.estimatedHours || undefined,
      tags: formValue.tags || []
    };

    await this.taskStore.updateTask(this.modalData.blueprintId, taskId, updateData, 'current-user');

    this.message.success('任務更新成功');
    this.modalRef.close({ success: true });
  }

  cancel(): void {
    this.modalRef.close({ success: false });
  }
}
