import type { TasksRepo } from '@/contexts/TasksRepoContext';
import type { TaskWriteRepo } from '@/contexts/TaskWriteRepoContext';

import {
  listenTasks,
  reorderColumnByIds,
  moveAndReorder,
  trashDoneByIds,
  createTask,
  toggleDone,
  softDeleteTask,
  updateTask,
} from '@/lib/tasks';

// ✅ TaskBoard（表示・D&D 用）
export const firestoreTasksRepo: TasksRepo = {
  listenTasks,
  reorderColumnByIds,
  moveAndReorder,
  trashDoneByIds,
};

// ✅ 追加・編集・削除用
export const firestoreTaskWriteRepo: TaskWriteRepo = {
  createTask: async (input) => {
    await createTask(input); // 戻り値は捨てる
  },
  toggleDone: async (task) => {
    await toggleDone(task);
  },
  softDeleteTask: async (task) => {
    await softDeleteTask(task);
  },
  updateTask: async (taskId, patch) => {
    await updateTask(taskId, patch);
  },
};
