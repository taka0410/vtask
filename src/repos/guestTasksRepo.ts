import type {
  TasksRepo,
  ColKey,
  Unsubscribe,
} from '@/contexts/TasksRepoContext';
import type { TaskWriteRepo } from '@/contexts/TaskWriteRepoContext';
import type { Status, Task } from '@/types/task';
import { guestTrashTasksRepo } from '@/repos/guestTrashTasksRepo';

type Listener = (tasks: Task[]) => void;

const genId = () =>
  globalThis.crypto?.randomUUID?.() ?? `guest_${Date.now()}_${Math.random()}`;

// state を shared にする（read/write どっちもここを見る）
const state: Record<ColKey, Task[]> = {
  planned: [],
  today: [],
  done: [],
};

const listeners: Record<ColKey, Set<Listener>> = {
  planned: new Set(),
  today: new Set(),
  done: new Set(),
};

function emit(k: ColKey) {
  const snapshot = [...state[k]];
  listeners[k].forEach((cb) => cb(snapshot));
}

function normalizeOrder(k: ColKey) {
  state[k] = state[k].map((t, i) => ({ ...t, order: i }));
}

function findColByIds(ids: string[]): ColKey | null {
  const cols: ColKey[] = ['planned', 'today', 'done'];
  for (const c of cols) {
    const allIncluded = ids.every((id) => state[c].some((t) => t.id === id));
    if (allIncluded) return c;
  }
  return null;
}

// ✅ TaskBoard 用（読み取り/並べ替え/移動/一括削除）
export function createGuestTasksRepo(): TasksRepo {
  return {
    listenTasks(status: ColKey, cb: (tasks: Task[]) => void): Unsubscribe {
      listeners[status].add(cb);
      cb([...state[status]]);
      return () => listeners[status].delete(cb);
    },

    // ✅ ここ重要：引数は ids 1つだけ
    async reorderColumnByIds(ids: string[]) {
      const col = findColByIds(ids);
      if (!col) return;

      const map = new Map(state[col].map((t) => [t.id, t] as const));
      const next: Task[] = [];

      for (const id of ids) {
        const t = map.get(id);
        if (t) next.push(t);
      }
      // 念のため ids に無い残りは末尾
      for (const t of state[col]) {
        if (!ids.includes(t.id)) next.push(t);
      }

      state[col] = next;
      normalizeOrder(col);
      emit(col);
    },

    async moveAndReorder(
      taskId: string,
      newStatus: Status,
      dstIds: string[],
      srcIds: string[],
    ) {
      const cols: ColKey[] = ['planned', 'today', 'done'];
      const srcCol = cols.find((c) => state[c].some((t) => t.id === taskId));
      if (!srcCol) return;

      const dstCol = newStatus as ColKey;
      const task = state[srcCol].find((t) => t.id === taskId);
      if (!task) return;

      // src から取り除く
      state[srcCol] = state[srcCol].filter((t) => t.id !== taskId);
      normalizeOrder(srcCol);

      // dst に追加（status更新）
      state[dstCol] = [
        ...state[dstCol],
        { ...task, status: newStatus, updatedAt: new Date() },
      ];
      normalizeOrder(dstCol);

      // ids に合わせて整列
      await this.reorderColumnByIds(srcIds);
      await this.reorderColumnByIds(dstIds);

      emit(srcCol);
      emit(dstCol);
    },

    async trashDoneByIds(ids: string[]) {
      const before = state.done.length;
      const set = new Set(ids);

      state.done = state.done.filter((t) => !set.has(t.id));
      normalizeOrder('done');
      emit('done');

      return before - state.done.length;
    },
  };
}

// ✅ AddTaskModal / TaskItem 用（今は TaskWriteRepo 型に合わせて create/toggle のみ）
export function createGuestTaskWriteRepo(): TaskWriteRepo {
  return {
    async createTask(input) {
      const status = input.status as ColKey;
      const now = new Date();

      const task: Task = {
        id: genId(),
        title: input.title,
        priority: input.priority,
        note: input.note ?? '',
        status,
        uid: 'guest',
        order: state[status].length,
        createdAt: now,
        updatedAt: now,
      };

      state[status] = [...state[status], task];
      normalizeOrder(status);
      emit(status);
    },

    async toggleDone(task: Task) {
      const cols: ColKey[] = ['planned', 'today', 'done'];
      const from = task.status as ColKey;
      if (!cols.includes(from)) return;

      const to: ColKey = from === 'done' ? 'today' : 'done';

      // from から削除
      state[from] = state[from].filter((t) => t.id !== task.id);
      normalizeOrder(from);

      // to に追加
      state[to] = [
        ...state[to],
        { ...task, status: to as any, updatedAt: new Date() },
      ];
      normalizeOrder(to);

      emit(from);
      emit(to);
    },

    softDeleteTask: async (task) => {
      const cols: ColKey[] = ['planned', 'today', 'done'];
      const from = task.status as ColKey;
      if (!cols.includes(from)) return;

      // 該当カラムから取り除く（メモリから消す）
      state[from] = state[from].filter((t) => t.id !== task.id);
      normalizeOrder(from);
      emit(from);

      guestTrashTasksRepo._push(task);
      // 削除済みリストに積みたいならここで保持もできる（任意）
      // deleted.push({ ...task, status: 'deleted' as any, prevStatus: from as any, deletedAt: new Date(), updatedAt: new Date() });
    },

    updateTask: async (taskId, patch) => {
      const cols: ColKey[] = ['planned', 'today', 'done'];
      const col = cols.find((c) => state[c].some((t) => t.id === taskId));
      if (!col) return;

      state[col] = state[col].map((t) =>
        t.id === taskId
          ? {
              ...t,
              title: patch.title,
              priority: patch.priority,
              note: patch.note,
              updatedAt: new Date(),
            }
          : t,
      );

      emit(col);
    },
  };
}
export const guestTasksRepo = createGuestTasksRepo();
export const guestTaskWriteRepo = createGuestTaskWriteRepo();
