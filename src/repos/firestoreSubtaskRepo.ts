import type { SubtaskRepo } from '@/contexts/SubtaskRepoContext';
import {
  listenSubtasks,
  createSubtask,
  updateSubtask,
  setSubtaskDone,
  deleteSubtask,
} from '@/lib/subtasks';

export const firestoreSubtaskRepo: SubtaskRepo = {
  listenSubtasks,
  createSubtask: async (parentId, title, note) => {
    await createSubtask(parentId, title, note);
  },
  updateSubtask: async (subtaskId, patch) => {
    await updateSubtask(subtaskId, patch);
  },
  setSubtaskDone: async (subtaskId, done) => {
    await setSubtaskDone(subtaskId, done);
  },
  deleteSubtask: async (subtaskId) => {
    await deleteSubtask(subtaskId);
  },
};
