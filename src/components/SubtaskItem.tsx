'use client';
import type { Subtask } from '@/types/subtask';
import { setSubtaskDone, deleteSubtask } from '@/lib/subtasks'; // ← toggleSubtaskDone を setSubtaskDone に変更
import SubtaskDetailModal from '@/components/SubtaskDetailModal';

type Props = { st: Subtask };

export default function SubtaskItem({ st }: Props) {
  return (
    <div className="flex items-center justify-between py-1 pr-2 group select-none">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={st.done}
          // stopPropagationを入れることで親要素のクリックが邪魔しない
          onChange={(e) => {
            e.stopPropagation();
            setSubtaskDone(st.id, !st.done);
          }}
        />
        <span className={st.done ? 'line-through text-gray-400' : ''}>
          {st.title}
        </span>
      </label>

      <SubtaskDetailModal st={st} />
    </div>
  );
}
