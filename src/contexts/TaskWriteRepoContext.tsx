'use client';

import { createContext, useContext } from 'react';
import type { Priority, Status, Task } from '@/types/task';

export type CreateTaskInput = {
  title: string;
  priority: Priority;
  note: string;
  status: Extract<Status, 'planned' | 'today' | 'done'>;
};

export type TaskWriteRepo = {
  createTask: (input: CreateTaskInput) => Promise<void>;
  toggleDone: (task: Task) => Promise<void>;
  softDeleteTask: (task: Task) => Promise<void>;

  updateTask: (
    taskId: string,
    patch: {
      title: string;
      priority: Priority;
      note: string;
    }
  ) => Promise<void>;
};

const Ctx = createContext<TaskWriteRepo | null>(null);

export function TaskWriteRepoProvider({
  repo,
  children,
}: {
  repo: TaskWriteRepo;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={repo}>{children}</Ctx.Provider>;
}

export function useTaskWriteRepo() {
  const v = useContext(Ctx);
  if (!v)
    throw new Error(
      'useTaskWriteRepo must be used within TaskWriteRepoProvider'
    );
  return v;
}
