'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGuest } from './GuestProvider';

export default function GuestApp() {
  const { tasks, addTask, deleteTask, addSubTask, toggleSubTask } = useGuest();

  const [title, setTitle] = useState('');
  const [subTitleByTask, setSubTitleByTask] = useState<Record<string, string>>(
    {}
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* 上部バナー */}
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-300">
            ゲストモード：このデータは保存されません（リロードで消えます）
          </p>
          <Link
            href="/login"
            className="text-[11px] text-sky-300 hover:text-sky-200 underline underline-offset-4"
          >
            ログインして保存する
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* 追加 */}
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タスク名を入力"
            className="w-full rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
          <button
            onClick={() => {
              addTask(title);
              setTitle('');
            }}
            className="shrink-0 rounded-lg bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-medium"
          >
            追加
          </button>
        </div>

        {/* 一覧 */}
        <div className="mt-6 space-y-4">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{t.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    priority: {t.priority} / status: {t.status}
                  </p>
                </div>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="text-xs text-slate-300 hover:text-red-300"
                >
                  削除
                </button>
              </div>

              {/* サブタスク */}
              <div className="mt-3 space-y-2">
                {t.subTasks.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={() => toggleSubTask(t.id, s.id)}
                    />
                    <span
                      className={s.done ? 'line-through text-slate-400' : ''}
                    >
                      {s.title}
                    </span>
                  </label>
                ))}
              </div>

              {/* サブタスク追加 */}
              <div className="mt-3 flex gap-2">
                <input
                  value={subTitleByTask[t.id] ?? ''}
                  onChange={(e) =>
                    setSubTitleByTask((prev) => ({
                      ...prev,
                      [t.id]: e.target.value,
                    }))
                  }
                  placeholder="サブタスクを追加"
                  className="w-full rounded-lg bg-slate-950/40 border border-slate-800 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
                <button
                  onClick={() => {
                    addSubTask(t.id, subTitleByTask[t.id] ?? '');
                    setSubTitleByTask((prev) => ({ ...prev, [t.id]: '' }));
                  }}
                  className="shrink-0 rounded-lg border border-slate-700 hover:border-slate-500 px-4 py-2 text-sm"
                >
                  追加
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
