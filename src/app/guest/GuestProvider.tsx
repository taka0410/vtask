'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Task } from '@/types/task';
import { GUEST_LIMITS } from '@/contexts/guestLimits';

type GuestSubTask = {
  id: string;
  title: string;
  done: boolean;
};

export type GuestTask = Task & {
  subTasks: GuestSubTask[];
};

type GuestContextType = {
  tasks: GuestTask[];
  addTask: (title: string) => void;
  deleteTask: (taskId: string) => void;
  addSubTask: (taskId: string, title: string) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
};

const GuestContext = createContext<GuestContextType | null>(null);

const uid = () => Math.random().toString(36).slice(2);

export function GuestProvider({ children }: { children: React.ReactNode }) {
  // 初期データ（体験感UP）
  const [tasks, setTasks] = useState<GuestTask[]>([
    {
      id: uid(),
      title: 'ようこそ！これはゲスト体験です',
      priority: '中',
      status: 'today',
      userId: 'guest',
      subTasks: [
        { id: uid(), title: 'タスクを追加してみる', done: false },
        { id: uid(), title: 'サブタスクを追加してみる', done: false },
      ],
    },
  ]);

  const addTask = (title: string) => {
    const t = title.trim();
    if (!t) return;

    if (tasks.length >= GUEST_LIMITS.TASK_MAX) {
      alert(`ゲストモードではタスクは最大${GUEST_LIMITS.TASK_MAX}件までです`);
      return;
    }

    const newTask: GuestTask = {
      id: uid(),
      title: t,
      priority: '中',
      status: 'today',
      userId: 'guest',
      subTasks: [],
    };

    setTasks((prev) => [newTask, ...prev]);
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const addSubTask = (taskId: string, title: string) => {
    const t = title.trim();
    if (!t) return;

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;

        if (task.subTasks.length >= GUEST_LIMITS.SUBTASK_MAX) {
          alert(
            `ゲストモードではサブタスクは最大${GUEST_LIMITS.SUBTASK_MAX}件までです`
          );
          return task;
        }

        return {
          ...task,
          subTasks: [...task.subTasks, { id: uid(), title: t, done: false }],
        };
      })
    );
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          subTasks: task.subTasks.map((s) =>
            s.id === subTaskId ? { ...s, done: !s.done } : s
          ),
        };
      })
    );
  };

  const value = useMemo(
    () => ({ tasks, addTask, deleteTask, addSubTask, toggleSubTask }),
    [tasks]
  );

  return (
    <GuestContext.Provider value={value}>{children}</GuestContext.Provider>
  );
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('useGuest must be used within <GuestProvider>');
  return ctx;
}
