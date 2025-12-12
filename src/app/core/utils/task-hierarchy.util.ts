/**
 * Task Hierarchy Utility
 * 任務階層工具
 *
 * Utility functions for building and managing hierarchical task structures
 *
 * @author GigHub Development Team
 * @date 2025-12-12
 */

import { TaskTreeNode } from '@core/types/task/task-view.types';
import { Task } from '@core/types/task/task.types';

/**
 * Build hierarchical tree structure from flat task list
 * 從扁平任務列表建立階層樹狀結構
 *
 * @param tasks - Flat list of tasks
 * @returns Hierarchical tree nodes (root level only)
 */
export function buildTaskHierarchy(tasks: Task[]): TaskTreeNode[] {
  if (!tasks || tasks.length === 0) {
    return [];
  }

  // Create a map for quick lookup
  const taskMap = new Map<string, TaskTreeNode>();
  const rootNodes: TaskTreeNode[] = [];

  // First pass: Create all nodes (filter out tasks without IDs)
  tasks.forEach(task => {
    if (!task.id) {
      console.warn('[buildTaskHierarchy] Skipping task without ID:', task);
      return;
    }
    
    const node: TaskTreeNode = {
      key: task.id,
      title: task.title,
      taskId: task.id,
      parentId: task.parentId || undefined,
      children: [],
      isLeaf: true, // Will be updated if children are found
      expanded: false,
      task: task // Store reference to original task
    };
    taskMap.set(task.id, node);
  });

  // Second pass: Build hierarchy
  taskMap.forEach(node => {
    if (node.parentId && taskMap.has(node.parentId)) {
      // This node has a parent
      const parentNode = taskMap.get(node.parentId)!;
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(node);
      parentNode.isLeaf = false; // Parent is not a leaf
    } else {
      // This is a root node
      rootNodes.push(node);
    }
  });

  // Sort children by creation date (optional)
  const sortChildren = (node: TaskTreeNode) => {
    if (node.children && node.children.length > 0) {
      node.children.sort((a, b) => {
        const dateA = a.task?.createdAt ? new Date(a.task.createdAt).getTime() : 0;
        const dateB = b.task?.createdAt ? new Date(b.task.createdAt).getTime() : 0;
        return dateA - dateB;
      });
      node.children.forEach(sortChildren);
    }
  };

  rootNodes.forEach(sortChildren);

  return rootNodes;
}

/**
 * Flatten hierarchical tree structure
 * 扁平化階層樹狀結構
 *
 * @param nodes - Hierarchical tree nodes
 * @returns Flat list of all nodes
 */
export function flattenTaskTree(nodes: TaskTreeNode[]): TaskTreeNode[] {
  const result: TaskTreeNode[] = [];

  const flatten = (node: TaskTreeNode) => {
    result.push(node);
    if (node.children && node.children.length > 0) {
      node.children.forEach(flatten);
    }
  };

  nodes.forEach(flatten);
  return result;
}

/**
 * Calculate aggregated progress for parent tasks
 * 計算父任務的聚合進度
 *
 * Progress is calculated as the average of all direct children's progress
 *
 * @param node - Tree node to calculate progress for
 * @returns Aggregated progress (0-100)
 */
export function calculateAggregatedProgress(node: TaskTreeNode): number {
  if (!node.children || node.children.length === 0) {
    // Leaf node - return its own progress
    return node.task?.progress ?? 0;
  }

  // Parent node - calculate average of children
  const childProgressSum = node.children.reduce((sum, child) => {
    return sum + calculateAggregatedProgress(child);
  }, 0);

  return Math.round(childProgressSum / node.children.length);
}

/**
 * Get all descendant task IDs
 * 取得所有後代任務 ID
 *
 * @param taskId - Parent task ID
 * @param tasks - All tasks
 * @returns Array of descendant task IDs
 */
export function getDescendantIds(taskId: string, tasks: Task[]): string[] {
  const descendants: string[] = [];

  const findChildren = (parentId: string) => {
    tasks.forEach(task => {
      if (task.parentId === parentId && task.id) {
        descendants.push(task.id);
        findChildren(task.id); // Recursive
      }
    });
  };

  findChildren(taskId);
  return descendants;
}

/**
 * Get all ancestor task IDs
 * 取得所有祖先任務 ID
 *
 * @param taskId - Child task ID
 * @param tasks - All tasks
 * @returns Array of ancestor task IDs (from immediate parent to root)
 */
export function getAncestorIds(taskId: string, tasks: Task[]): string[] {
  const ancestors: string[] = [];
  const taskMap = new Map(tasks.filter(t => t.id != null).map(t => [t.id as string, t]));

  let currentId: string | null | undefined = taskId;
  while (currentId) {
    const task = taskMap.get(currentId);
    if (task?.parentId) {
      ancestors.push(task.parentId);
      currentId = task.parentId;
    } else {
      break;
    }
  }

  return ancestors;
}

/**
 * Validate parent-child relationship
 * 驗證父子關係
 *
 * Ensures no circular references and valid hierarchy
 *
 * @param childId - Child task ID
 * @param parentId - Proposed parent task ID
 * @param tasks - All tasks
 * @returns True if relationship is valid
 */
export function isValidParentChild(childId: string, parentId: string | null | undefined, tasks: Task[]): boolean {
  if (!parentId) {
    return true; // No parent is always valid
  }

  if (childId === parentId) {
    return false; // Cannot be parent of itself
  }

  // Check if parentId would create circular reference
  const ancestors = getAncestorIds(parentId, tasks);
  if (ancestors.includes(childId)) {
    return false; // Circular reference detected
  }

  return true;
}

/**
 * Get task depth in hierarchy
 * 取得任務在階層中的深度
 *
 * @param taskId - Task ID
 * @param tasks - All tasks
 * @returns Depth level (0 for root, 1 for first level children, etc.)
 */
export function getTaskDepth(taskId: string, tasks: Task[]): number {
  const ancestors = getAncestorIds(taskId, tasks);
  return ancestors.length;
}

/**
 * Sort tasks maintaining parent-child order
 * 排序任務並維持父子順序
 *
 * @param tasks - Tasks to sort
 * @returns Sorted tasks with parents before children
 */
export function sortTasksHierarchically(tasks: Task[]): Task[] {
  const hierarchy = buildTaskHierarchy(tasks);
  const flat = flattenTaskTree(hierarchy);

  // Map back to original tasks (filter out null/undefined IDs)
  const taskMap = new Map(tasks.filter(t => t.id != null).map(t => [t.id as string, t]));
  return flat.map(node => taskMap.get(node.taskId)).filter((t): t is Task => t !== undefined);
}
