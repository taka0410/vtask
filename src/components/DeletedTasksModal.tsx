'use client';

import { useEffect, useState } from 'react';
import type { Task } from '@/types/task';

// ★ここをあなたの実装に合わせて変更してください
// 例：useTasks() / useTaskActions() / useTaskRepo() など
import { useTaskRepo } from '@/contexts/TaskRepoProvider';

type Unsub = () => void;

// localStorageキーはこのファイル内で完結させる（UI設定なのでOK）
const AUTO_PURGE_KEY = 'vtask:autoPurgeTrash';

function getAutoPurgeFlag() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTO_PURGE_KEY) === '1';
}
function setAutoPurgeFlag(v: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTO_PURGE_KEY, v ? '1' : '0');
}

export default function DeletedTasksModal() {
  const repo = useTaskRepo(); // ★guest/firestore を repo 側で吸収

  const [open, setOpen] = useState(false);

  // 削除済みリスト
  const [list, setList] = useState<Task[] | undefined>(undefined);

  // クリック連打防止
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // 自動削除フラグ
  const [autoPurge, setAutoPurge] = useState(false);

  // 起動時：フラグ読み取り + trash購読 + 必要なら古いtrash掃除
  useEffect(() => {
    const flag = getAutoPurgeFlag();
    setAutoPurge(flag);

    // フラグONなら「古い削除済みを掃除」
    if (flag) {
      repo.purgeOldTrash?.({ months: 3 }).catch(() => void 0);
    }

    // trash購読
    const unsub: Unsub = repo.listenTrash((items: Task[]) => setList(items));
    return () => {
      try {
        unsub?.();
      } catch {
        /* noop */
      }
    };
  }, [repo]);

  const toggleAutoPurge = () => {
    const next = !autoPurge;
    setAutoPurge(next);
    setAutoPurgeFlag(next);

    if (next) {
      repo.purgeOldTrash?.({ months: 3 }).catch(() => void 0);
    }
  };

  // 1件復元
  const onRestore = async (t: Task) => {
    if (busyIds.has(t.id)) return;

    const next = new Set(busyIds);
    next.add(t.id);
    setBusyIds(next);

    try {
      await repo.restoreTask(t);
      // listenTrash が効いていれば即消える
    } catch (e) {
      console.error('[restoreTask failed]', e);
      alert('元に戻すに失敗しました。コンソールを確認してください。');
    } finally {
      const n2 = new Set(next);
      n2.delete(t.id);
      setBusyIds(n2);
    }
  };

  // 1件完全削除
  const onHardDelete = async (t: Task) => {
    if (
      !confirm(
        `「${t.title}」を完全に削除します。元に戻せません。よろしいですか？`
      )
    )
      return;

    if (busyIds.has(t.id)) return;

    const next = new Set(busyIds);
    next.add(t.id);
    setBusyIds(next);

    try {
      await repo.hardDeleteTask(t.id);
    } catch (e) {
      console.error('[hardDeleteTask failed]', e);
      alert('削除に失敗しました。コンソールを確認してください。');
    } finally {
      const n2 = new Set(next);
      n2.delete(t.id);
      setBusyIds(n2);
    }
  };

  // 一括完全削除
  const onPurgeAll = async () => {
    if (!list?.length) return;

    if (
      !confirm(
        `削除済みを ${list.length} 件、完全に削除します。元に戻せません。よろしいですか？`
      )
    )
      return;

    setBulkBusy(true);
    try {
      await repo.purgeAllTrash();
    } catch (e) {
      console.error('[purgeAllTrash failed]', e);
      alert('一括削除に失敗しました。コンソールを確認してください。');
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        className="px-3 py-1 rounded bg-gray-700 text-white cursor-pointer"
        onClick={() => setOpen(true)}
      >
        削除済み{list === undefined ? '' : `（${list.length}）`}
      </button>

      {!open ? null : (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl w-[min(700px,92vw)] p-4 text-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pr-10">
              <h2 className="font-semibold text-lg text-neutral-900">
                削除済みタスク
              </h2>

              <div className="hidden md:flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoPurge}
                    onChange={toggleAutoPurge}
                    className="cursor-pointer"
                  />
                  3ヶ月後自動削除
                </label>

                <button
                  type="button"
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={bulkBusy || (list?.length ?? 0) === 0}
                  onClick={onPurgeAll}
                >
                  一括削除
                </button>
              </div>

              <button
                type="button"
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 cursor-pointer"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-2 max-h-[60vh] overflow-auto">
              {list === undefined ? (
                <p className="text-sm text-neutral-600">読み込み中…</p>
              ) : list.length === 0 ? (
                <p className="text-sm text-neutral-600">
                  削除済みはありません。
                </p>
              ) : (
                list.map((t) => {
                  const busy = busyIds.has(t.id);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 px-2 py-2 border rounded-md"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-800 truncate">
                          {t.title}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 text-blue-500 hover:underline cursor-pointer"
                          disabled={busy}
                          onClick={() => onRestore(t)}
                        >
                          元に戻す
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 text-red-500 hover:underline cursor-pointer"
                          disabled={busy}
                          onClick={() => onHardDelete(t)}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 md:hidden">
              <label className="inline-flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPurge}
                  onChange={toggleAutoPurge}
                  className="cursor-pointer"
                />
                3ヶ月後自動削除
              </label>

              <button
                type="button"
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full"
                disabled={bulkBusy || (list?.length ?? 0) === 0}
                onClick={onPurgeAll}
              >
                一括削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
