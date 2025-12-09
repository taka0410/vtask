// src/components/SubtaskList.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Subtask } from '@/types/subtask';
import { listenSubtasks } from '@/lib/subtasks';
import SubtaskItem from './SubtaskItem';

export default function SubtaskList({ parentId }: { parentId: string }) {
  const [list, setList] = useState<Subtask[]>([]);

  useEffect(() => {
    if (!parentId) {
      setList([]);
      return;
    }
    const unsub = listenSubtasks(parentId, (items: Subtask[]) =>
      setList(items)
    );
    return () => {
      try {
        unsub();
      } catch {
        /* no-op */
      }
    };
  }, [parentId]);

  return (
    <div className="flex flex-col gap-1">
      {list.map((st: Subtask) => (
        <SubtaskItem key={st.id} st={st} />
      ))}
    </div>
  );
}
