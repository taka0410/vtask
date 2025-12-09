'use client';
import { useState, useEffect } from 'react';
import { createTask } from '@/lib/tasks';
import type { Priority } from '@/types/task';
import { createPortal } from 'react-dom';

type Props = {
  defaultStatus: 'planned' | 'today';
  onClose?: () => void;
};

export default function AddTaskModal({ defaultStatus, onClose }: Props) {
  const [open, setOpen] = useState(true);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('中');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ★ モーダル開閉で <body> にクラスを付ける
  useEffect(() => {
    if (open) document.body.classList.add('vtask-modal-open');
    else document.body.classList.remove('vtask-modal-open');
    return () => document.body.classList.remove('vtask-modal-open');
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const save = async () => {
    if (isSaving) return; // 二重送信防止
    console.log('[AddTaskModal] save() start', {
      title,
      priority,
      note,
      defaultStatus,
    });

    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    try {
      setIsSaving(true);
      await createTask({
        title: title.trim(),
        priority,
        note,
        status: defaultStatus,
      });

      console.log('[AddTaskModal] save() success');
      // 入力リセット
      setTitle('');
      setNote('');
      setPriority('高');
      handleClose();
    } catch (e: any) {
      console.error('[AddTaskModal] save() error:', e);
      alert('保存に失敗しました（コンソールを確認してください）');
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------
  // ここからモーダル本体（createPortalで最前面表示）
  // --------------------------------------------------------
  return (
    <>
      {open &&
        createPortal(
          <div
            className="vtask-portal fixed inset-0 bg-black/40 flex items-center justify-center z-[99999] pointer-events-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose();
            }}
          >
            <div
              className="relative bg-white text-black w-[90%] max-w-md sm:w-full rounded-xl p-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-4 top-2 p-1 rounded hover:bg-gray-200 cursor-pointer"
                aria-label="閉じる"
              >
                ×
              </button>

              <h3 className="font-bold mb-3">タスクを追加</h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log('[submit] fired');
                  void save();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    void save();
                  }
                }}
                className="space-y-3"
              >
                <input
                  className="w-full border rounded px-3 py-2 mb-2"
                  placeholder="タスク名"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <div className="flex gap-2 items-center mb-2">
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
                  placeholder="説明（URLやメモ）"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="border px-3 py-1 rounded cursor-pointer"
                    onClick={handleClose}
                  >
                    キャンセル
                  </button>

                  <button
                    type="submit"
                    onClick={(e) => {
                      e.stopPropagation?.();
                      console.log('[click] 保存');
                    }}
                    className="bg-black text-white px-3 py-1 rounded cursor-pointer disabled:opacity-50"
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
