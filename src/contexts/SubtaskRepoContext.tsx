'use client';

import { createContext, useContext } from 'react';
import type { Subtask } from '@/types/subtask';

export type Unsubscribe = () => void;

export type SubtaskRepo = {
  listenSubtasks: (
    parentId: string,
    cb: (items: Subtask[]) => void,
  ) => Unsubscribe;
  createSubtask: (
    parentId: string,
    title: string,
    note?: string,
  ) => Promise<void>;
  updateSubtask: (
    subtaskId: string,
    patch: { title?: string; note?: string },
  ) => Promise<void>;

  setSubtaskDone: (subtaskId: string, done: boolean) => Promise<void>;
  deleteSubtask: (subtaskId: string) => Promise<void>;
};

const Ctx = createContext<SubtaskRepo | null>(null);

export function SubtaskRepoProvider({
  repo,
  children,
}: {
  repo: SubtaskRepo;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={repo}>{children}</Ctx.Provider>;
}

export function useSubtaskRepo() {
  const v = useContext(Ctx);
  if (!v)
    throw new Error('useSubtaskRepo must be used within SubtaskRepoProvider');
  return v;
}
