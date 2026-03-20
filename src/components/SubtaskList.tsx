// src/components/SubtaskList.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Subtask } from '@/types/subtask';
import { useSubtaskRepo } from '@/contexts/SubtaskRepoContext';
import SubtaskItem from './SubtaskItem';

export default function SubtaskList({ parentId }: { parentId: string }) {
  const repo = useSubtaskRepo(); // ✅ ここに移動
  const [list, setList] = useState<Subtask[]>([]);

  useEffect(() => {
    if (!parentId) return;

    const unsub = repo.listenSubtasks(parentId, (items) => setList(items));
    return () => unsub();
  }, [parentId, repo]); // ✅ repoも依存に入れる

  return (
    <div className="mt-2 space-y-2">
      {list.map((s) => (
        <SubtaskItem key={s.id} st={s} />
      ))}
    </div>
  );
}
