'use client';
import { useEffect, useState } from 'react';
import type { Subtask } from '@/types/subtask';
import { useSubtaskRepo } from '@/contexts/SubtaskRepoContext';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

type Props = { st: Subtask };

export default function SubtaskDetailModal({ st }: Props) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(st.title);
  const [note, setNote] = useState(st.note ?? '');
  const [busy, setBusy] = useState(false);
  const repo = useSubtaskRepo();

  // 編集表示時はタイトルに自動フォーカス
  useEffect(() => {
    if (open && edit) {
      const t = setTimeout(() => {
        document
          .querySelector<HTMLInputElement>('.edit-subtask-input')
          ?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [open, edit]);

  const handleClose = () => {
    setOpen(false);
    setEdit(false);
  };
  async function save() {
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    if (busy) return;
    try {
      setBusy(true);
      await repo.updateSubtask(st.id, {
        title: title.trim(),
        note: note.trim(),
      });
      setEdit(false);
      setOpen(false);
    } catch (e: any) {
      alert(e?.message || '保存に失敗しました');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* 詳細を開くトリガー（← ここにも cursor-pointer を付与） */}
      <button
        type="button"
        title="サブタスク詳細"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center h-8 w-8 box-border
           border border-zinc-600 rounded text-[10px] text-zinc-100
           hover:bg-zinc-800 cursor-pointer transition-colors"
      >
        詳細
      </button>

      {!open
        ? null
        : createPortal(
            <div
              className="fixed inset-0 bg-black/40 z-[99999] flex items-center justify-center"
              onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
              }}
            >
              <div
                className="relative bg-white text-black w-[90%] max-w-md sm:w-full rounded-xl p-4 pointer-events-auto max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ヘッダー：右側アイコンは「✎ → 🗑 → ×」の順 */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">サブタスクの詳細</h3>
                  <div className="flex items-center gap-3">
                    {/* ✎ 編集 */}
                    {!edit && (
                      <button
                        onClick={() => setEdit(true)}
                        aria-label="編集"
                        title="編集"
                        disabled={busy}
                        className="p-1 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50"
                      >
                        ✎
                      </button>
                    )}

                    {/* 🗑 削除 */}
                    {!edit && (
                      <button
                        className="p-1 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50"
                        title="削除"
                        onClick={async () => {
                          if (
                            !confirm(
                              'このサブタスクを削除します。よろしいですか？',
                            )
                          )
                            return;
                          try {
                            setBusy(true);
                            await repo.deleteSubtask(st.id);
                            handleClose();
                          } catch (e: any) {
                            alert(e?.message || '削除に失敗しました');
                          } finally {
                            setBusy(false);
                          }
                        }}
                        disabled={busy}
                        aria-label="削除"
                      >
                        <Trash2 size={18} strokeWidth={2} />
                      </button>
                    )}

                    {/* × 閉じる */}
                    <button
                      onClick={handleClose}
                      aria-label="閉じる"
                      title="閉じる"
                      disabled={busy}
                      className="p-1 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50 text-xl"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* 本文：閲覧＝タイトル/備考を表示、編集＝フォーム表示 */}
                {!edit ? (
                  <div className="space-y-4">
                    <div className="text-sm break-words">
                      <div className="text-xs text-gray-500 mb-1">
                        サブタスク名
                      </div>
                      <div>{title}</div>{' '}
                      {/* ← state を使うので編集後も一貫表示 */}
                    </div>

                    {note?.trim() ? (
                      <div className="text-sm break-words">
                        <div className="text-xs text-gray-500 mb-1">備考</div>
                        <div
                          className="whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: note.replace(
                              /(https?:\/\/[^\s]+)/g,
                              '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">$1</a>',
                            ),
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void save();
                    }}
                    onKeyDownCapture={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        void save();
                      }
                    }}
                  >
                    <div>
                      <div className="text-xs text-gray-500 mb-1">タイトル</div>
                      <input
                        className="edit-subtask-input w-full border rounded px-3 py-2"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">備考</div>
                      <textarea
                        className="w-full border rounded px-3 py-2 h-28"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                  </form>
                )}

                {/* フッター */}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="border px-3 py-1 rounded disabled:opacity-50 cursor-pointer"
                    disabled={busy}
                  >
                    キャンセル
                  </button>
                  {edit && (
                    <button
                      type="button"
                      onClick={save}
                      className="bg-black text-white px-3 py-1 rounded disabled:opacity-50 cursor-pointer"
                      disabled={busy}
                    >
                      {busy ? '保存中…' : '保存'}
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )}
    </>
  );
}
