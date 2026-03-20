import type { Task } from '@/types/task';

type Listener = (items: Task[]) => void;

const trash: Task[] = [];
const listeners = new Set<Listener>();

function emit() {
  const snap = [...trash];
  listeners.forEach((cb) => cb(snap));
}

export const guestTrashTasksRepo = {
  listenTrash(cb: (items: Task[]) => void) {
    listeners.add(cb);
    cb([...trash]);
    return () => listeners.delete(cb);
  },

  async restoreTask(task: Task) {
    // 今は「trashから消す」だけ（復元先カラムへ戻す処理は後で連携）
    const idx = trash.findIndex((t) => t.id === task.id);
    if (idx === -1) return;
    trash.splice(idx, 1);
    emit();
  },

  async hardDeleteTask(taskId: string) {
    const before = trash.length;
    const next = trash.filter((t) => t.id !== taskId);
    trash.length = 0;
    trash.push(...next);
    if (trash.length !== before) emit();
  },

  async purgeAllTrash() {
    if (trash.length === 0) return;
    trash.length = 0;
    emit();
  },

  async purgeOldTrash(_opt: { months: number }) {
    // guestでは一旦未実装でもOK（必要ならdeletedAtを持たせて実装する）
  },

  // ★softDelete から積む用（DeletedTasksModalに表示させる）
  _push(task: Task) {
    trash.unshift(task);
    emit();

    guestTrashTasksRepo._push(task);
  },
};
