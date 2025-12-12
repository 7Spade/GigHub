/**
 * Construction Log Modal Component
 * 工地施工日誌模態框元件
 *
 * Features:
 * - Create/Edit/View construction logs
 * - Photo upload with preview
 * - Form validation
 *
 * ✅ Uses ng-zorro-antd modal and form
 * ✅ Uses Angular 20 Signals
 *
 * @author GigHub Development Team
 * @date 2025-12-11
 */

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Log, CreateLogRequest, UpdateLogRequest } from '@core/types/log/log.types';
import { SHARED_IMPORTS } from '@shared';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';

import { ConstructionLogStore } from './construction-log.store';

interface ModalData {
  blueprintId: string;
  log?: Log;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-construction-log-modal',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="submit()">
      <!-- Date -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>日期</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="請選擇日期">
          <nz-date-picker formControlName="date" nzFormat="yyyy-MM-dd" style="width: 100%;" />
        </nz-form-control>
      </nz-form-item>

      <!-- Title -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired>標題</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="請輸入標題">
          <input nz-input formControlName="title" placeholder="例如：地基開挖" />
        </nz-form-control>
      </nz-form-item>

      <!-- Description -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">描述</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <textarea nz-input formControlName="description" [nzAutosize]="{ minRows: 3, maxRows: 6 }" placeholder="工作內容描述"></textarea>
        </nz-form-control>
      </nz-form-item>

      <!-- Work Hours -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">工時</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-input-number formControlName="workHours" [nzMin]="0" [nzMax]="24" [nzStep]="0.5" style="width: 100%;" />
          <span style="margin-left: 8px;">小時</span>
        </nz-form-control>
      </nz-form-item>

      <!-- Workers -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">工人數</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-input-number formControlName="workers" [nzMin]="0" [nzMax]="1000" style="width: 100%;" />
          <span style="margin-left: 8px;">人</span>
        </nz-form-control>
      </nz-form-item>

      <!-- Equipment -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">設備</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <input nz-input formControlName="equipment" placeholder="例如：挖土機、卡車" />
        </nz-form-control>
      </nz-form-item>

      <!-- Weather -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">天氣</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-select formControlName="weather" nzPlaceHolder="選擇天氣" nzAllowClear style="width: 100%;">
            <nz-option nzValue="晴" nzLabel="晴"></nz-option>
            <nz-option nzValue="多雲" nzLabel="多雲"></nz-option>
            <nz-option nzValue="陰" nzLabel="陰"></nz-option>
            <nz-option nzValue="雨" nzLabel="雨"></nz-option>
            <nz-option nzValue="大雨" nzLabel="大雨"></nz-option>
            <nz-option nzValue="雷雨" nzLabel="雷雨"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- Temperature -->
      <nz-form-item>
        <nz-form-label [nzSpan]="6">溫度</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <nz-input-number formControlName="temperature" [nzMin]="-20" [nzMax]="50" style="width: 100%;" />
          <span style="margin-left: 8px;">°C</span>
        </nz-form-control>
      </nz-form-item>

      <!-- Photos -->
      @if (modalData.mode !== 'view') {
        <nz-form-item>
          <nz-form-label [nzSpan]="6">照片</nz-form-label>
          <nz-form-control [nzSpan]="14">
            <nz-upload
              nzType="drag"
              [nzMultiple]="true"
              [nzAccept]="'image/*'"
              [nzBeforeUpload]="beforeUpload"
              (nzChange)="handleUploadChange($event)"
              [nzShowUploadList]="{ showPreviewIcon: true, showRemoveIcon: true }"
            >
              <p class="ant-upload-drag-icon">
                <span nz-icon nzType="inbox"></span>
              </p>
              <p class="ant-upload-text">點擊或拖曳照片到此區域上傳</p>
              <p class="ant-upload-hint">支援單個或批量上傳，建議照片大小小於 5MB</p>
            </nz-upload>
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Existing Photos (Edit/View mode) -->
      @if (modalData.log?.photos && (modalData.log?.photos?.length ?? 0) > 0) {
        <nz-form-item>
          <nz-form-label [nzSpan]="6">現有照片</nz-form-label>
          <nz-form-control [nzSpan]="14">
            <nz-row [nzGutter]="[8, 8]">
              @for (photo of modalData.log?.photos; track photo.id) {
                <nz-col [nzSpan]="8">
                  <div class="photo-item">
                    <img [src]="photo.publicUrl" [alt]="photo.caption || '照片'" style="width: 100%; height: 100px; object-fit: cover;" />
                    @if (modalData.mode === 'edit') {
                      <button
                        nz-button
                        nzType="link"
                        nzDanger
                        nzSize="small"
                        (click)="deletePhoto(photo.id)"
                        style="position: absolute; top: 0; right: 0;"
                      >
                        <span nz-icon nzType="delete"></span>
                      </button>
                    }
                  </div>
                </nz-col>
              }
            </nz-row>
          </nz-form-control>
        </nz-form-item>
      }

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
      .photo-item {
        position: relative;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        overflow: hidden;
      }
    `
  ]
})
export class ConstructionLogModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalRef = inject(NzModalRef);
  private message = inject(NzMessageService);
  private logStore = inject(ConstructionLogStore);

  // Modal data injected
  modalData: ModalData = inject(NZ_MODAL_DATA);

  // Form
  form!: FormGroup;

  // State
  submitting = signal(false);
  fileList = signal<File[]>([]);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const log = this.modalData.log;
    const isView = this.modalData.mode === 'view';

    this.form = this.fb.group({
      date: [log?.date || new Date(), [Validators.required]],
      title: [{ value: log?.title || '', disabled: isView }, [Validators.required, Validators.maxLength(100)]],
      description: [{ value: log?.description || '', disabled: isView }, [Validators.maxLength(1000)]],
      workHours: [{ value: log?.workHours || null, disabled: isView }],
      workers: [{ value: log?.workers || null, disabled: isView }],
      equipment: [{ value: log?.equipment || '', disabled: isView }],
      weather: [{ value: log?.weather || null, disabled: isView }],
      temperature: [{ value: log?.temperature || null, disabled: isView }]
    });
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    // Validate file type
    if (!file.type?.startsWith('image/')) {
      this.message.error('只能上傳圖片檔案');
      return false;
    }

    // Validate file size (5MB)
    const isLt5M = file.size! / 1024 / 1024 < 5;
    if (!isLt5M) {
      this.message.error('圖片大小必須小於 5MB');
      return false;
    }

    // Add to file list (don't auto upload)
    this.fileList.update(list => [...list, file as any]);
    return false; // Prevent auto upload
  };

  handleUploadChange(event: NzUploadChangeParam): void {
    console.log('Upload change:', event);
  }

  async deletePhoto(photoId: string): Promise<void> {
    try {
      const blueprintId = this.modalData.blueprintId;
      const logId = this.modalData.log?.id;

      if (!logId) return;

      await this.logStore.deletePhoto(blueprintId, logId, photoId);
      this.message.success('照片刪除成功');

      // Refresh modal data
      if (this.modalData.log) {
        this.modalData.log.photos = this.modalData.log.photos.filter(p => p.id !== photoId);
      }
    } catch (error) {
      console.error('Failed to delete photo:', error);
      this.message.error('照片刪除失敗');
    }
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
        await this.createLog(formValue);
      } else if (this.modalData.mode === 'edit') {
        await this.updateLog(formValue);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      this.message.error('操作失敗');
    } finally {
      this.submitting.set(false);
    }
  }

  private async createLog(formValue: any): Promise<void> {
    const request: CreateLogRequest = {
      blueprintId: this.modalData.blueprintId,
      date: formValue.date,
      title: formValue.title,
      description: formValue.description,
      workHours: formValue.workHours,
      workers: formValue.workers,
      equipment: formValue.equipment,
      weather: formValue.weather,
      temperature: formValue.temperature,
      creatorId: 'current-user' // TODO: Get from auth service
    };

    const newLog = await this.logStore.createLog(request);

    if (!newLog) {
      throw new Error('Failed to create log');
    }

    // Upload photos if any
    if (this.fileList().length > 0) {
      await this.uploadPhotos(newLog.id);
    }

    this.modalRef.close({ success: true, log: newLog });
  }

  private async updateLog(formValue: any): Promise<void> {
    const logId = this.modalData.log?.id;
    if (!logId) {
      throw new Error('Log ID not found');
    }

    const request: UpdateLogRequest = {
      date: formValue.date,
      title: formValue.title,
      description: formValue.description,
      workHours: formValue.workHours,
      workers: formValue.workers,
      equipment: formValue.equipment,
      weather: formValue.weather,
      temperature: formValue.temperature
    };

    const updatedLog = await this.logStore.updateLog(this.modalData.blueprintId, logId, request);

    if (!updatedLog) {
      throw new Error('Failed to update log');
    }

    // Upload new photos if any
    if (this.fileList().length > 0) {
      await this.uploadPhotos(logId);
    }

    this.modalRef.close({ success: true, log: updatedLog });
  }

  private async uploadPhotos(logId: string): Promise<void> {
    const files = this.fileList();
    const uploadPromises = files.map(file => this.logStore.uploadPhoto(this.modalData.blueprintId, logId, file));

    await Promise.all(uploadPromises);
  }

  cancel(): void {
    this.modalRef.close({ success: false });
  }
}
