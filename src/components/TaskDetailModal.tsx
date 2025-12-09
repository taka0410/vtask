'use client';
import { useState } from 'react';
import type { Task, Priority } from '@/types/task';
import { updateTask } from '@/lib/tasks';
import { useEffect } from 'react';
import { softDeleteTask } from '@/lib/tasks';
import { Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';

/** 文字列内のURLを <a> に変換して表示する */
function renderWithLinks(text: string) {
  if (!text) return <span className="text-gray-400">（なし）</span>;
  const urlRe = /(https?:\/\/[^\s]+)/g;

  const parts = text.split(urlRe);
  return (
    <>
      {parts.map((part, i) => {
        if (urlRe.test(part)) {
          // URLだったらリンクにする（新規タブで開く）
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline break-all"
            >
              {part}
            </a>
          );
        }
        // それ以外はそのまま（改行維持）
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function TaskDetailModal({
  task,
  buttonClassName,
  onOpen,
}: {
  task: Task;
  buttonClassName?: string;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false); // 詳細モード／編集モードの切替
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [note, setNote] = useState(task.note ?? '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) document.body.classList.add('vtask-modal-open');
    else document.body.classList.remove('vtask-modal-open');
    return () => document.body.classList.remove('vtask-modal-open');
  }, [open]);

  useEffect(() => {
    if (open && edit) {
      const t = setTimeout(() => {
        document.querySelector<HTMLInputElement>('.edit-task-input')?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [open, edit]);

  async function save() {
    if (!title.trim()) {
      alert('タイトルを入力してください');
      return;
    }

    setBusy(true);
    try {
      await updateTask(task.id, { title: title.trim(), priority, note });
      // 成功したら閉じる
      setEdit(false);
      setOpen(false);
    } catch (e: any) {
      alert(e?.message || '保存に失敗しました');
    } finally {
      setBusy(false);
    }
  }

  const PriorityBadge = ({ p }: { p: Priority }) => (
    <span className="text-xs border rounded px-2 py-0.5">{p}</span>
  );

  return (
    <>
      {/* タスク行の右側に出すボタン（編集→詳細に変更） */}
      <button
        className={
          buttonClassName ?? 'text-xs border px-2 py-1 rounded cursor-pointer'
        }
        onClick={() => {
          // 毎回、最新値で開けるよう初期化
          setTitle(task.title);
          setPriority(task.priority);
          setNote(task.note ?? '');
          setEdit(false);
          setOpen(true);

          // ★ アコーディオンを閉じる
          if (onOpen) onOpen();
        }}
        title="詳細"
      >
        詳細
      </button>
      {!open
        ? null
        : createPortal(
            <div
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
              onClick={(e) => {
                // 黒背景クリックで閉じる（内側クリックは閉じない）
                if (e.target === e.currentTarget) setOpen(false);
              }}
            >
              <div
                className="bg-white text-black w-[90%] max-w-md sm:w-full rounded-xl p-4 max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">
                      {edit ? 'タスクを編集' : 'タスクの詳細'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* 編集ボタン */}
                    {!edit && (
                      <button
                        className="p-1 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                        title="編集"
                        onClick={() => setEdit(true)}
                      >
                        ✎
                      </button>
                    )}

                    {/* 🗑 削除ボタン（新規追加） */}
                    {!edit && (
                      <button
                        className="p-1 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                        title="削除"
                        onClick={async () => {
                          if (
                            !confirm('このタスクを削除します。よろしいですか？')
                          )
                            return;
                          try {
                            setBusy(true);
                            await softDeleteTask(task); // Firestore 上で削除扱い
                            setOpen(false);
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

                    {/* 閉じるボタン */}
                    <button
                      className="p-1 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                      onClick={() => setOpen(false)}
                      title="閉じる"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* 本文 */}
                {!edit ? (
                  // ▼ 詳細モード（URLは自動リンク化）
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">タスク名</div>
                      <div className="whitespace-pre-wrap break-words">
                        {renderWithLinks(title)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">優先度</div>
                      <PriorityBadge p={priority} />
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 mb-1">備考</div>
                      <div className="min-h-[3rem] whitespace-pre-wrap break-words">
                        {renderWithLinks(note)}
                      </div>
                    </div>
                  </div>
                ) : (
                  // ▼ 編集モード
                  // ▼ 編集モード（フォーム化）
                  <form
                    className="space-y-3"
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
                    <div>
                      <div className="text-xs text-gray-500 mb-1">タスク名</div>
                      <input
                        className="edit-task-input w-full border rounded px-3 py-2"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">優先度</label>
                      <select
                        className="border rounded px-2 py-1 cursor-pointer"
                        value={priority}
                        onChange={(e) =>
                          setPriority(e.target.value as Priority)
                        }
                      >
                        <option value="高">高</option>
                        <option value="中">中</option>
                        <option value="低">低</option>
                      </select>
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
                <div className="flex justify-end gap-2 mt-4">
                  {edit ? (
                    <>
                      <button
                        className="border px-3 py-1 rounded cursor-pointer disabled:opacity-50"
                        onClick={() => {
                          setOpen(false);
                          setEdit(false);
                        }}
                        disabled={busy}
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        formAction="submit" // 念のため（フォーム外クリックでも効くブラウザあり）
                        className="bg-black text-white px-3 py-1 rounded disabled:opacity-50 cursor-pointer"
                        disabled={busy}
                        onClick={save}
                      >
                        {busy ? '保存中…' : '保存'}
                      </button>
                    </>
                  ) : (
                    <button
                      className="border px-3 py-1 rounded cursor-pointer"
                      onClick={() => setOpen(false)}
                    >
                      閉じる
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
    </>
  );
}
