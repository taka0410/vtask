'use client';
import { useState, useEffect } from 'react';
import type { Subtask } from '@/types/subtask';
import { updateSubtask } from '@/lib/subtasks';
import { createPortal } from 'react-dom';

export default function EditSubtaskModal({ st }: { st: Subtask }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(st.title);
  const [note, setNote] = useState(st.note ?? '');
  const [busy, setBusy] = useState(false);

  // 編集モーダルが開いたらタイトルに自動フォーカス
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        document
          .querySelector<HTMLInputElement>('.edit-subtask-input')
          ?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setTitle(st.title);
    setNote(st.note ?? '');
  }, [st.id]);

  const handleClose = () => setOpen(false);

  async function save() {
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    if (busy) return;

    try {
      setBusy(true);
      await updateSubtask(st.id, { title: title.trim(), note: note.trim() });
      // 成功後に閉じる（保存前に閉じない）
      handleClose();
    } catch (e: any) {
      alert(e?.message || '保存に失敗しました（コンソールを確認してください）');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="text-[11px] border px-2 py-0.5 rounded cursor-pointer"
        onClick={() => setOpen(true)}
        title="サブタスク編集"
      >
        編集
      </button>

      {!open
        ? null
        : createPortal(
            <div
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999]"
              onClick={(e) => {
                // 外側(黒背景)だけで閉じる。内側クリックは閉じない & 親への伝播を遮断
                e.stopPropagation();
                if (e.target === e.currentTarget) handleClose();
              }}
            >
              <div
                className="relative bg-white text-black w-[90%] max-w-sm sm:w-full rounded-xl p-4 pointer-events-auto max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">サブタスクを編集</h3>
                  <button
                    className="text-xl cursor-pointer"
                    onClick={handleClose}
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save();
                  }}
                  onKeyDownCapture={(e) => {
                    // Ctrl+Enter / Cmd+Enter で保存
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      void save();
                    }
                  }}
                >
                  <input
                    className="edit-subtask-input w-full border rounded px-3 py-2 mb-3"
                    placeholder="サブタスク名"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <textarea
                    className="w-full border rounded px-3 py-2 h-28 mb-3"
                    placeholder="備考"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="border px-3 py-1 rounded cursor-pointer disabled:opacity-50"
                      onClick={handleClose}
                      disabled={busy}
                    >
                      キャンセル
                    </button>

                    {/* ← クリックは submit に統一。保存前に閉じない！ */}
                    <button
                      type="submit"
                      className="bg-black text-white px-3 py-1 rounded disabled:opacity-50 cursor-pointer"
                      disabled={busy}
                    >
                      {busy ? '保存中…' : '保存'}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
    </>
  );
}
