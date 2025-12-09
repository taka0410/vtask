'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import TaskItem from '@/components/TaskItem';
import { listenTasks, reorderColumnByIds, moveAndReorder } from '@/lib/tasks';
import type { Task, Status } from '@/types/task';
import AddTaskModal from '@/components/AddTaskModal';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { fetchDoneTaskIds, trashDoneByIds } from '@/lib/tasks';

type ColKey = 'planned' | 'today' | 'done';

export default function TaskBoard() {
  const [planned, setPlanned] = useState<Task[]>([]);
  const [today, setToday] = useState<Task[]>([]);
  const [done, setDone] = useState<Task[]>([]);
  const [addTo, setAddTo] = useState<'planned' | 'today' | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // body.class の変化を監視（vtask-modal-open の付け外し）
    const update = () =>
      setModalOpen(document.body.classList.contains('vtask-modal-open'));

    update(); // 初期反映
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // ★テスト用：画面の一番上に「完了→削除済み」実行ボタンを一時的に出す
  const TestTopButton = () => (
    <div className="p-2">
      <button
        type="button"
        className="border px-3 py-1 rounded bg-zinc-800"
        onClick={handleBulkTrashDone}
      >
        【テスト】完了→削除済みに一括移動
      </button>
    </div>
  );

  // リアルタイム購読（3カラム）
  useEffect(() => {
    const un1 = listenTasks('planned', setPlanned);
    const un2 = listenTasks('today', setToday);
    const un3 = listenTasks('done', setDone);
    return () => {
      un1();
      un2();
      un3();
    };
  }, []);

  const columns: Record<
    ColKey,
    {
      title: string;
      tasks: Task[];
      set: (t: Task[]) => void;
      addTo?: 'planned' | 'today';
    }
  > = {
    planned: {
      title: '予定タスク',
      tasks: planned,
      set: setPlanned,
      addTo: 'planned',
    },
    today: {
      title: '本日のタスク',
      tasks: today,
      set: setToday,
      addTo: 'today',
    },
    done: { title: '完了タスク', tasks: done, set: setDone },
  };

  const [busyTrashDone, setBusyTrashDone] = useState(false);
  const [trashKey, setTrashKey] = useState(0);
  const doneColumn = columns['done'];
  const doneCount = doneColumn?.tasks.length ?? 0;
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (busyTrashDone) setBusyTrashDone(false);
  }, [done.length]);

  const handleBulkTrashDone = useCallback(async () => {
    console.log('[CLICK] trash');

    if (busyTrashDone) return; // 二重押しガード
    setBusyTrashDone(true);
    console.log('[BUSY ON]');

    try {
      // いま画面に見えている「完了」カラムのIDを固定
      const ids = (columns['done']?.tasks ?? []).map((t) => t.id);
      console.log('[IDS]', ids.length);
      if (!ids.length) {
        alert('対象のタスクがありません。');
        return;
      }

      const moved = await trashDoneByIds(ids);
      // 先に busy を下ろしてからアラート（UIの体感を軽くする）
      setBusyTrashDone(false);
      console.log('[BUSY OFF]');
      alert(`${moved} 件のタスクを削除済みに移動しました。`);
    } catch (e) {
      console.error(e);
      setBusyTrashDone(false);
      alert('移動に失敗しました。');
    }
  }, [busyTrashDone, columns]);

  useEffect(() => {
    return () => setBusyTrashDone(false);
  }, []);

  function localReorder(list: Task[], startIndex: number, endIndex: number) {
    const res = Array.from(list);
    const [removed] = res.splice(startIndex, 1);
    res.splice(endIndex, 0, removed);
    return res;
  }

  async function onDragEnd(result: DropResult) {
    if (modalOpen) return;
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const srcCol = source.droppableId as ColKey;
    const dstCol = destination.droppableId as ColKey;

    // 同一カラム内の並べ替え
    if (srcCol === dstCol) {
      const col = columns[srcCol];
      const reordered = localReorder(
        col.tasks,
        source.index,
        destination.index
      );
      col.set(reordered); // まずはローカルでサクッと並べ替え
      // Firestoreへ order 確定
      await reorderColumnByIds(reordered.map((t) => t.id));
      return;
    }

    // 別カラムへ移動
    const src = columns[srcCol];
    const dst = columns[dstCol];

    const srcList = Array.from(src.tasks);
    const [moved] = srcList.splice(source.index, 1);

    const dstList = Array.from(dst.tasks);
    dstList.splice(destination.index, 0, moved);

    // ローカル反映
    src.set(srcList);
    dst.set(dstList);

    // Firestore：status変更 + 両カラムのorder確定
    await moveAndReorder(
      draggableId,
      dstCol as Status,
      dstList.map((t) => t.id),
      srcList.map((t) => t.id)
    );
  }

  // 各カラム（予定・本日・完了）を描画する共通処理
  const renderColumn = (key: ColKey, extraClass: string) => {
    const col = columns[key];

    return (
      <section
        key={key}
        className={`border rounded pt-3 pb-3 pl-3 pr-0 flex flex-col h-full ${extraClass}`}
      >
        {/* ヘッダー（タイトル + 右上ボタン） */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">{col.title}</h2>

          {/* 右上ボタン：完了列はゴミ箱／他は追加ボタン */}
          <div className="ml-auto flex items-center gap-2 pr-2">
            {key === 'done' ? (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={modalOpen ? undefined : handleBulkTrashDone}
                disabled={busyTrashDone || modalOpen}
                className={
                  'p-1.5 rounded ' +
                  (busyTrashDone || modalOpen
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-zinc-800 cursor-pointer')
                }
                title="完了タスクを一括で削除済みに移動"
              >
                {busyTrashDone ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>
            ) : (
              // 予定/本日 列の「＋」
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => {
                  if (!modalOpen) setAddTo(key as 'planned' | 'today');
                }}
                disabled={modalOpen}
                className={
                  'p-1.5 rounded ' +
                  (modalOpen
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-zinc-800 cursor-pointer')
                }
                title="タスクを追加"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* タスクリスト（Droppable 内） */}
        <Droppable
          droppableId={key}
          direction="vertical"
          ignoreContainerClipping={true}
          isDropDisabled={modalOpen}
        >
          {(provided, snapshot) => {
            const isEmpty = (col.tasks?.length ?? 0) === 0;
            return (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`select-none flex-1 scrollbar-dark-thin ${
                  snapshot.isDraggingOver ? 'bg-zinc-700/60' : ''
                }`}
                style={{
                  paddingTop: isEmpty ? 8 : 4,
                  paddingBottom: 24, // 常に少しだけ余白
                  overflowY: 'auto', // ここだけスクロール
                  position: 'relative',
                }}
              >
                {col.tasks.map((t, idx) => (
                  <Draggable
                    key={t.id}
                    draggableId={t.id}
                    index={idx}
                    isDragDisabled={modalOpen}
                  >
                    {(drag) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        {...drag.dragHandleProps}
                        className={
                          modalOpen
                            ? 'cursor-default'
                            : 'cursor-grab active:cursor-grabbing'
                        }
                      >
                        <TaskItem task={t} />
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
                {/* ★ 余計な空白を作っていたスペーサーは削除 or 小さく */}
                {/* <div className="pointer-events-none h-40" /> ←これは削除 */}
              </div>
            );
          }}
        </Droppable>

        {/* 追加モーダル（この列のときだけ出す） */}
        {addTo === 'planned' && key === 'planned' && (
          <AddTaskModal
            defaultStatus="planned"
            onClose={() => setAddTo(null)}
          />
        )}
        {addTo === 'today' && key === 'today' && (
          <AddTaskModal defaultStatus="today" onClose={() => setAddTo(null)} />
        )}
      </section>
    );
  };

  return (
    <DragDropContext
      onDragStart={() => setDragging(true)}
      onDragEnd={async (result) => {
        setDragging(false);
        await onDragEnd(result);
      }}
    >
      <div
        className="grid grid-cols-1 gap-4 p-4
      md:grid-cols-3 md:grid-rows-2 md:h-[calc(100vh-65px)]"
      >
        {/* ① 予定タスク（左上） */}
        {renderColumn('planned', 'md:row-start-1 md:col-start-1')}

        {/* ③ 本日のタスク（右側を上下ぶち抜き・横幅2/3） */}
        {renderColumn(
          'today',
          'md:row-start-1 md:col-start-2 md:row-span-2 md:col-span-2'
        )}

        {/* ② 完了タスク（左下） */}
        {renderColumn('done', 'md:row-start-2 md:col-start-1')}
      </div>
    </DragDropContext>
  );
}
