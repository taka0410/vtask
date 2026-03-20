'use client';
import { useState, useEffect } from 'react';
import type { Task, Priority } from '@/types/task';
import { useTaskWriteRepo } from '@/contexts/TaskWriteRepoContext';
import { createPortal } from 'react-dom';

export default function EditTaskModal({ task }: { task: Task }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [note, setNote] = useState(task.note ?? '');
  // ★ 状態は isSaving に一本化（busy を廃止）
  const [isSaving, setIsSaving] = useState(false);
  const write = useTaskWriteRepo();

  useEffect(() => {
    if (open) document.body.classList.add('vtask-modal-open');
    else document.body.classList.remove('vtask-modal-open');
    return () => document.body.classList.remove('vtask-modal-open');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Mac の Cmd+Enter も拾えるように metaKey も許可
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // input/textarea内でも確実に保存
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, title, priority, note, isSaving]);

  // 🟢 編集モーダルが開いたら自動でタイトル欄にフォーカス
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        document.querySelector<HTMLInputElement>('.edit-task-input')?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
  };

  // ★ 保存処理：ログ + 例外捕捉 + 二重押し防止
  const save = async () => {
    if (isSaving) return; // 二重送信防止
    console.log('[EditTaskModal] save() start', {
      title,
      priority,
      note,
      id: task?.id,
    });

    if (!title?.trim()) {
      alert('タイトルを入力してください');
      return;
    }
    if (!task?.id) {
      console.error('[EditTaskModal] missing task.id', task);
      alert('タスクIDが見つかりません（コンソール参照）');
      return;
    }

    try {
      setIsSaving(true);

      // ★ ここで実処理。失敗時のエラーを可視化
      await write.updateTask(task.id, {
        title: title.trim(),
        priority, // Priority が '高' | '中' | '低' であることを想定
        note,
      });

      console.log('[EditTaskModal] save() success');
      handleClose(); // 成功で閉じる
    } catch (err: any) {
      console.error('[EditTaskModal] save() error:', err);
      alert(err?.message || '保存に失敗しました（コンソール参照）');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        className="text-xs border px-2 py-1 rounded cursor-pointer"
        onClick={() => setOpen(true)}
        title="編集"
      >
        編集
      </button>

      {!open
        ? null
        : createPortal(
            <div
              className="vtask-portal fixed inset-0 bg-black/40 flex items-center justify-center z-[99999] pointer-events-auto"
              onClick={(e) => {
                // 外側（黒背景）クリックで閉じるが、親モーダルへの伝播を止める
                e.stopPropagation();
                if (e.target === e.currentTarget) handleClose();
              }}
            >
              <div
                className="relative bg-white text-black w-[90%] max-w-md sm:w-full rounded-xl p-4 pointer-events-auto max-h-[85vh] overflow-y-auto sm:max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ⬇ ここに元の中身（タイトルやフォームなど）をそのまま戻す */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">タスクを編集</h3>
                  <button
                    className="text-xl cursor-pointer"
                    onClick={() => setOpen(false)}
                    aria-label="閉じる"
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await save();
                  }}
                  onKeyDownCapture={(e) => {
                    if (e.key === 'Enter' && !(e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      return;
                    }
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      void save();
                    }
                  }}
                  className="space-y-3"
                >
                  <input
                    className="edit-task-input w-full border rounded px-3 py-2"
                    placeholder="タスク名"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">優先度</label>
                    <select
                      className="border rounded px-2 py-1 cursor-pointer"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                    >
                      <option value="高">高</option>
                      <option value="中">中</option>
                      <option value="低">低</option>
                    </select>
                  </div>

                  <textarea
                    className="w-full border rounded px-3 py-2 h-28"
                    placeholder="備考（メモ）"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      className="border px-3 py-1 rounded cursor-pointer disabled:opacity-50"
                      onClick={() => setOpen(false)}
                      disabled={isSaving}
                    >
                      キャンセル
                    </button>

                    <button
                      type="submit"
                      onClick={(e) => {
                        e.stopPropagation?.();
                        void save();
                      }}
                      className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
                      disabled={isSaving}
                    >
                      {isSaving ? '保存中…' : '保存'}
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
