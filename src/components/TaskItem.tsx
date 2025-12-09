'use client';
import { useState, useEffect, useRef } from 'react';
import { toggleDone } from '@/lib/tasks';
import type { Task } from '@/types/task';
import AddSubtaskModal from '@/components/AddSubtaskModal';
import SubtaskList from '@/components/SubtaskList';
import TaskDetailModal from '@/components/TaskDetailModal';
import { softDeleteTask } from '@/lib/tasks';
import { Plus, Minus } from 'lucide-react';

export default function TaskItem({
  task,
  innerRef,
  draggableProps,
  dragHandleProps,
}: {
  task: Task;
  innerRef?: (el: HTMLElement | null) => void;
  draggableProps?: any;
  dragHandleProps?: any;
}) {
  const [actOpen, setActOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // 右端の小ボタンやメニュー内ボタンを完全統一
  // アコーディオン内の「詳細」「サブタスクの追加」共通デザイン
  const DROPDOWN_BTN =
    'inline-flex items-center justify-center h-8 w-full box-border ' +
    'border border-zinc-600 rounded text-zinc-100 hover:bg-zinc-800 ' +
    'cursor-pointer transition-colors text-xs';

  const SQUARE_BTN =
    'inline-flex items-center justify-center h-8 w-8 box-border ' +
    'border border-zinc-600 rounded text-zinc-100 hover:bg-zinc-800 ' +
    'cursor-pointer transition-colors text-[10px]';

  useEffect(() => {
    if (!actOpen) return;

    // 外側クリックで閉じる（mousedown → click に変更）
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActOpen(false);
      }
    };

    // Escキーで閉じる
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActOpen(false);
    };

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [actOpen]);

  // 削除済みカラム以外では × を出す
  const showDelete = task.status !== 'deleted';

  return (
    <div
      ref={innerRef as any}
      {...draggableProps} // ← ラッパーには dragHandleProps を付けない
      className="py-2 group"
    >
      {/* 親タスク 1行（タイトル行） */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          {/* 並べ替えハンドル（ここにだけ dragHandleProps を付与） */}
          <span
            {...dragHandleProps}
            className="text-gray-400 cursor-grab active:cursor-grabbing select-none px-1"
            title="タスクの並べ替え"
            aria-label="タスク並べ替えハンドル"
          >
            ≡
          </span>

          {/* チェック・タイトル・優先度 */}
          <input
            type="checkbox"
            checked={task.status === 'done'}
            onChange={() => toggleDone(task)}
          />
          <span
            className={
              task.status === 'done' ? 'line-through text-gray-400' : ''
            }
          >
            {task.title}
          </span>
          <span
            className={`text-xs border px-1 rounded mr-2
    ${task.priority === '高' ? 'bg-red-600 text-white' : ''}
    ${task.priority === '中' ? 'bg-yellow-400 text-black' : ''}
    ${task.priority === '低' ? 'bg-blue-600 text-white' : ''}`}
          >
            {task.priority}
          </span>
        </label>

        {/* 右端アクション（＋/－ トグル → ドロップダウン） */}
        <div className="ml-auto relative pr-2">
          {/* トグル（＋→－） */}
          <button
            type="button"
            aria-expanded={actOpen}
            onClick={(e) => {
              e.stopPropagation();
              setActOpen((v) => !v);
            }}
            className={SQUARE_BTN}
          >
            {actOpen ? (
              <Minus className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>

          {/* メニュー本体（アコーディオン） */}
          <div
            ref={menuRef}
            className={`absolute right-2 mt-2 z-40 w-40 rounded border border-zinc-700 bg-zinc-900 shadow-lg
                overflow-hidden transition-[max-height,opacity] duration-200
                ${actOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 flex flex-col gap-2">
              {/* 詳細：ボタンを押した瞬間にアコーディオンを閉じる */}
              <TaskDetailModal
                task={task}
                buttonClassName={DROPDOWN_BTN}
                onOpen={() => setActOpen(false)}
              />

              {/* サブタスク追加：同じくボタン押下時にアコーディオンを閉じる */}
              <AddSubtaskModal
                parentId={task.id}
                variant="text"
                className={DROPDOWN_BTN}
                onOpen={() => setActOpen(false)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 親タスクの直下にサブタスク */}
      <div className="mt-1 ml-6 pl-3 border-l border-gray-700/40">
        <SubtaskList parentId={task.id} />
      </div>
    </div>
  );
}
