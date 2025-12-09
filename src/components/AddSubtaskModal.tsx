'use client';
import { useState, useEffect } from 'react';
import { createSubtask } from '@/lib/subtasks';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';

export default function AddSubtaskModal({
  parentId,
  variant = 'text',
  className = '',
  onOpen,
}: {
  parentId: string;
  variant?: 'text' | 'icon';
  className?: string;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        document.querySelector<HTMLInputElement>('.add-subtask-title')?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleClose = () => setOpen(false);

  const save = async () => {
    if (isSaving) return;
    if (!title.trim()) {
      alert('サブタスク名を入力してください');
      return;
    }

    try {
      setIsSaving(true);
      console.log('[AddSubtaskModal] save() start', { parentId, title });

      await createSubtask(parentId, title.trim(), note.trim());
      console.log('[AddSubtaskModal] save() success');

      setTitle('');
      setNote(''); // 追加：保存後に備考もクリア
      handleClose();
    } catch (err) {
      console.error('[AddSubtaskModal] save() error:', err);
      alert('保存に失敗しました（コンソールを確認してください）');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          title="サブタスクを追加"
          onClick={() => {
            setOpen(true);
            if (onOpen) onOpen(); // ★ ここでアコーディオンを閉じる
          }}
          className={
            'inline-flex items-center justify-center h-8 w-[56px] box-border ' +
            'border border-zinc-600 rounded text-zinc-100 ' +
            'hover:bg-zinc-800 cursor-pointer transition-colors ' +
            className
          }
        >
          <Plus className="w-5 h-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            if (onOpen) onOpen(); // ★ 同じくここ
          }}
          className={
            className || 'text-xs border px-2 py-1 rounded cursor-pointer'
          }
        >
          サブタスクの追加
        </button>
      )}

      {!open
        ? null
        : createPortal(
            <div
              className="vtask-portal fixed inset-0 bg-black/40 flex items-center justify-center z-[99999]"
              onClick={(e) => {
                if (e.target === e.currentTarget) handleClose();
              }}
            >
              <div
                className="relative bg-white text-black w-[90%] max-w-md sm:w-full rounded-xl p-4 pointer-events-auto max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">サブタスクを追加</h3>
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
                    save();
                  }}
                  onKeyDownCapture={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      save();
                    }
                  }}
                >
                  <input
                    className="add-subtask-title w-full border rounded px-3 py-2 mb-3"
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
                      className="border px-3 py-1 rounded cursor-pointer"
                      onClick={handleClose}
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-black text-white px-3 py-1 rounded cursor-pointer disabled:opacity-50"
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
