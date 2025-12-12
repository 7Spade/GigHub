/**
 * Task Tree View Component
 * 任務樹狀視圖元件
 *
 * Displays tasks in hierarchical tree structure using ng-zorro-antd tree-view
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { Component, input, signal, computed, inject } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { NzTreeFlatDataSource, NzTreeFlattener } from 'ng-zorro-antd/tree-view';
import { SHARED_IMPORTS } from '@shared';
import { Task, TaskTreeNode } from '@core/types/task';
import { TaskStore } from '@core/stores/task.store';

/** Flat node structure for CDK tree */
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
  taskId: string;
  task: Task;
}

@Component({
  selector: 'app-task-tree-view',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="tree-view-container">
      @if (loading()) {
        <nz-spin nzSimple />
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()" nzShowIcon />
      } @else {
        <nz-tree-view [nzTreeControl]="treeControl" [nzDataSource]="dataSource">
          <nz-tree-node *nzTreeNodeDef="let node" nzTreeNodePadding>
            <nz-tree-node-toggle nzTreeNodeNoopToggle></nz-tree-node-toggle>
            <nz-tree-node-option [nzDisabled]="node.disabled">
              <span nz-icon nzType="file" nzTheme="outline"></span>
              {{ node.name }}
              <nz-badge [nzStatus]="getStatusBadge(node.task.status)" style="margin-left: 8px;" />
              @if (node.task.progress !== undefined) {
                <nz-progress 
                  [nzPercent]="node.task.progress" 
                  nzSize="small" 
                  [nzShowInfo]="false"
                  style="width: 100px; margin-left: 8px;"
                />
              }
            </nz-tree-node-option>
          </nz-tree-node>

          <nz-tree-node *nzTreeNodeDef="let node; when: hasChild" nzTreeNodePadding>
            <nz-tree-node-toggle>
              <span nz-icon [nzType]="treeControl.isExpanded(node) ? 'folder-open' : 'folder'" nzTheme="outline"></span>
            </nz-tree-node-toggle>
            <nz-tree-node-option [nzDisabled]="node.disabled">
              {{ node.name }}
              <nz-badge [nzStatus]="getStatusBadge(node.task.status)" style="margin-left: 8px;" />
            </nz-tree-node-option>
          </nz-tree-node>
        </nz-tree-view>
      }
    </div>
  `,
  styles: [
    `
      .tree-view-container {
        padding: 16px;
        height: 100%;
        overflow: auto;
      }
    `
  ]
})
export class TaskTreeViewComponent {
  private taskStore = inject(TaskStore);

  // Input from parent
  blueprintId = input.required<string>();

  // Expose store state
  readonly loading = this.taskStore.loading;
  readonly error = this.taskStore.error;

  // Tree control and data source
  readonly treeControl = new FlatTreeControl<FlatNode>(
    node => node.level,
    node => node.expandable
  );

  private readonly transformer = (node: TaskTreeNode, level: number): FlatNode => ({
    expandable: !!node.children && node.children.length > 0,
    name: node.title,
    level,
    taskId: node.taskId,
    task: node as any
  });

  private readonly treeFlattener = new NzTreeFlattener(
    this.transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  readonly dataSource = new NzTreeFlatDataSource(this.treeControl, this.treeFlattener);

  // Convert tasks to tree structure
  private treeData = computed(() => {
    const tasks = this.taskStore.tasks();
    const treeNodes = this.buildTreeNodes(tasks);
    this.dataSource.setData(treeNodes);
    return treeNodes;
  });

  readonly hasChild = (_: number, node: FlatNode): boolean => node.expandable;

  /**
   * Build tree nodes from flat task list
   */
  private buildTreeNodes(tasks: Task[]): TaskTreeNode[] {
    // For now, create a simple flat list as tree nodes
    // TODO: Implement parent-child relationship when Task model includes parentId
    return tasks.map(task => ({
      key: task.id!,
      title: task.title,
      taskId: task.id!,
      isLeaf: true,
      task
    }));
  }

  /**
   * Get status badge color
   */
  getStatusBadge(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'default',
      in_progress: 'processing',
      on_hold: 'warning',
      completed: 'success',
      cancelled: 'error'
    };
    return statusMap[status] || 'default';
  }
}
