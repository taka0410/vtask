import type { SubtaskRepo } from '@/contexts/SubtaskRepoContext';
import type { Subtask } from '@/types/subtask';

type Listener = (items: Subtask[]) => void;

const genId = () =>
  globalThis.crypto?.randomUUID?.() ?? `gst_${Date.now()}_${Math.random()}`;

const store = new Map<string, Subtask[]>(); // parentId -> subtasks
const listeners = new Map<string, Set<Listener>>(); // parentId -> listeners

function emit(parentId: string) {
  const items = store.get(parentId) ?? [];
  const subs = listeners.get(parentId);
  if (!subs) return;
  const snapshot = [...items];
  subs.forEach((cb) => cb(snapshot));
}

export const guestSubtaskRepo: SubtaskRepo = {
  listenSubtasks(parentId, cb) {
    if (!listeners.has(parentId)) listeners.set(parentId, new Set());
    listeners.get(parentId)!.add(cb);

    cb([...(store.get(parentId) ?? [])]);

    return () => {
      listeners.get(parentId)?.delete(cb);
    };
  },

  async createSubtask(parentId, title, note) {
    const list = store.get(parentId) ?? [];

    const sub: Subtask = {
      id: genId(),
      parentId,
      title,
      done: false,
      order: list.length,
      note: note?.trim() ? note.trim() : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.set(parentId, [...list, sub]);
    emit(parentId);
  },

  async updateSubtask(subtaskId, patch) {
    for (const [parentId, list] of store.entries()) {
      const idx = list.findIndex((s) => s.id === subtaskId);
      if (idx === -1) continue;

      const next = [...list];
      next[idx] = {
        ...next[idx],
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.note !== undefined
          ? { note: patch.note?.trim() ? patch.note.trim() : undefined }
          : {}),
        updatedAt: new Date(),
      };

      store.set(parentId, next);
      emit(parentId);
      return;
    }
  },

  async setSubtaskDone(subtaskId, done) {
    // id から親(parentId)を逆引きして更新
    for (const [parentId, list] of store.entries()) {
      const idx = list.findIndex((s) => s.id === subtaskId);
      if (idx === -1) continue;

      const next = [...list];
      next[idx] = { ...next[idx], done, updatedAt: new Date() };
      store.set(parentId, next);
      emit(parentId);
      return;
    }
  },

  async deleteSubtask(subtaskId) {
    for (const [parentId, list] of store.entries()) {
      const next = list.filter((s) => s.id !== subtaskId);
      if (next.length === list.length) continue; // 見つからないなら次へ

      // order を詰め直す
      store.set(
        parentId,
        next.map((s, i) => ({ ...s, order: i, updatedAt: new Date() })),
      );
      emit(parentId);
      return;
    }
  },
};
