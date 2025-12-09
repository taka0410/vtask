'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { Task } from '@/types/task';

// ← ここが超重要。listenTrash / restoreTask / hardDeleteTask / purgeAllTrash を使います
import {
  listenTrash, // status === 'trash' の一覧を購読
  restoreTask, // 1件を元に戻す（deletedFrom へ）
  hardDeleteTask, // 1件を完全削除（物理削除）
  purgeAllTrash, // 全件完全削除（物理削除）
  getAutoPurgeFlag, // 自動削除のON/OFFをlocalStorageに保存/取得
  setAutoPurgeFlag,
  purgeOldDeletedIfAutoOn, // 自動削除（3ヶ月）を走らせる
} from '@/lib/tasks';

// お好みでモーダルのUIは既存のものを使ってOK
export default function DeletedTasksModal() {
  const [open, setOpen] = useState(false);

  // 削除済みリスト
  const [list, setList] = useState<Task[] | undefined>(undefined);

  // クリック連打を防ぐための状態
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // 自動削除フラグ
  const [autoPurge, setAutoPurge] = useState(false);

  useEffect(() => {
    // 起動時に自動削除がONなら古いゴミ箱を掃除
    purgeOldDeletedIfAutoOn().catch(() => void 0);

    const unsub = listenTrash((items) => {
      setList(items);
    });
    return () => {
      try {
        unsub();
      } catch {
        /* no-op */
      }
    };
  }, []);

  // 自動削除フラグの読み書き
  useEffect(() => {
    setAutoPurge(getAutoPurgeFlag());
  }, []);
  const toggleAutoPurge = () => {
    const next = !autoPurge;
    setAutoPurge(next);
    setAutoPurgeFlag(next);
    // ONにしたタイミングで一度掃除を走らせると分かりやすい
    if (next) purgeOldDeletedIfAutoOn().catch(() => void 0);
  };

  // 1件復元
  const onRestore = async (t: Task) => {
    if (busyIds.has(t.id)) return;
    const next = new Set(busyIds);
    next.add(t.id);
    setBusyIds(next);
    try {
      await restoreTask(t); // ← moveTask ではなく restoreTask を必ず使う
      // onSnapshot で即座に消える（= listenTrash が正しく動いていれば）
    } catch (e) {
      console.error('[restoreTask failed]', e);
      alert('元に戻すに失敗しました。コンソールを確認してください。');
    } finally {
      const n2 = new Set(busyIds);
      n2.delete(t.id);
      setBusyIds(n2);
    }
  };

  // 1件完全削除
  const onHardDelete = async (t: Task) => {
    if (
      confirm(
        `削除済みを ${list?.length ?? 0} 件、完全に削除します。元に戻せません。よろしいですか？`
      )
    )
      return;
    if (busyIds.has(t.id)) return;
    const next = new Set(busyIds);
    next.add(t.id);
    setBusyIds(next);
    try {
      await hardDeleteTask(t.id);
      // onSnapshot で即座に消える
    } catch (e) {
      console.error('[hardDeleteTask failed]', e);
      alert('削除に失敗しました。コンソールを確認してください。');
    } finally {
      const n2 = new Set(busyIds);
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
      const count = await purgeAllTrash();
      // 成功していれば購読でスッと0件になる
      if (count === 0) {
        // 0でも購読によりUI側は正しいので何もしない
      }
    } catch (e) {
      console.error('[purgeAllTrash failed]', e);
      alert('一括削除に失敗しました。コンソールを確認してください。');
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div>
      {/* モーダルを開くトリガー（お好みで） */}
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
            {/* ヘッダー */}
            <div className="flex items-center justify-between gap-3 pr-10">
              <h2 className="font-semibold text-lg text-neutral-900">
                削除済みタスク
              </h2>

              {/* PC版：ヘッダー右側に「自動削除」と「一括削除」を表示 */}
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

              {/* 閉じるボタン（画面サイズ共通） */}
              <button
                type="button"
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 cursor-pointer"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* 削除済みタスク一覧 */}
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
                      {/* ▼ タイトル部分：長文を省略してボタンを圧迫しない */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-800 truncate">
                          {t.title}
                        </div>
                      </div>

                      {/* ▼ ボタン部分：横並びを維持（shrink禁止） */}
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

            {/* スマホ版：下部に「自動削除」と「一括削除」を表示 */}
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
