import type { Task } from '@/types/task';
import {
  listenTrash,
  restoreTask,
  hardDeleteTask,
  purgeAllTrash,
  purgeOldDeletedIfAutoOn,
} from '@/lib/tasks';

export const firestoreTrashTasksRepo = {
  listenTrash(cb: (items: Task[]) => void) {
    return listenTrash(cb);
  },

  async restoreTask(task: Task) {
    await restoreTask(task);
  },

  async hardDeleteTask(taskId: string) {
    await hardDeleteTask(taskId);
  },

  async purgeAllTrash() {
    await purgeAllTrash();
  },

  async purgeOldTrash(_opt: { months: number }) {
    await purgeOldDeletedIfAutoOn();
  },
};
