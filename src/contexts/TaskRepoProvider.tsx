'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { Task } from '@/types/task';

// DeletedTasksModal が使う最低限の repo インターフェース
export type TaskRepo = {
  listenTrash: (cb: (items: Task[]) => void) => () => void;
  restoreTask: (task: Task) => Promise<void>;
  hardDeleteTask: (taskId: string) => Promise<void>;
  purgeAllTrash: () => Promise<void>;
  purgeOldTrash?: (opt: { months: number }) => Promise<void>;
};

const TaskRepoContext = createContext<TaskRepo | null>(null);

export function useTaskRepo() {
  const ctx = useContext(TaskRepoContext);
  if (!ctx) throw new Error('useTaskRepo must be used within TaskRepoProvider');
  return ctx;
}

// ★ここが差し替えポイント：あなたの repo 実装に合わせて import してね
// 例）すでに作ってあるならパスだけ合わせる
import { firestoreTrashTasksRepo } from '@/repos/firestoreTrashTasksRepo';
import { guestTrashTasksRepo } from '@/repos/guestTrashTasksRepo';

export function TaskRepoProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 今回は「/guest ならゲスト」と判定（最短で動く）
  // もし既に GuestProvider 等があるなら、後でそこから isGuest を取る形に置き換えればOK
  const isGuest = pathname?.startsWith('/guest') ?? false;

  const repo = useMemo(() => {
    return isGuest ? guestTrashTasksRepo : firestoreTrashTasksRepo;
  }, [isGuest]);

  return (
    <TaskRepoContext.Provider value={repo}>{children}</TaskRepoContext.Provider>
  );
}
