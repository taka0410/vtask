'use client';

import { createContext, useContext } from 'react';
import type { Status, Task } from '@/types/task';

export type ColKey = 'planned' | 'today' | 'done';
export type Unsubscribe = () => void;

export type TasksRepo = {
  listenTasks: (status: ColKey, cb: (tasks: Task[]) => void) => Unsubscribe;
  reorderColumnByIds: (ids: string[]) => Promise<void>;
  moveAndReorder: (
    taskId: string,
    newStatus: Status,
    dstIds: string[],
    srcIds: string[]
  ) => Promise<void>;
  trashDoneByIds: (ids: string[]) => Promise<number>;
};

const TasksRepoContext = createContext<TasksRepo | null>(null);

export function TasksRepoProvider({
  repo,
  children,
}: {
  repo: TasksRepo;
  children: React.ReactNode;
}) {
  return (
    <TasksRepoContext.Provider value={repo}>{children}</TasksRepoContext.Provider>
  );
}

export function useTasksRepo() {
  const v = useContext(TasksRepoContext);
  if (!v) throw new Error('useTasksRepo must be used within TasksRepoProvider');
  return v;
}
