'use client';
import { useEffect, useState } from 'react';
import { listenTasks } from '@/lib/tasks';
import type { Status, Task } from '@/types/task';
import TaskItem from './TaskItem';

export default function TaskList({ status }: { status: Status }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let stop: (() => void) | undefined;
    try {
      stop = listenTasks(status, setTasks);
    } catch (e) {
      // 未ログインで呼ばれた時など
      console.warn(e);
    }
    return () => stop && stop();
  }, [status]);

  return (
    <div>
      {tasks.length === 0 ? (
        <div className="text-sm text-gray-500">（まだありません）</div>
      ) : (
        tasks.map((t) => <TaskItem key={t.id} task={t} />)
      )}
    </div>
  );
}
