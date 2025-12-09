// src/lib/subtasks.ts
'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Subtask } from '@/types/subtask';

const SUBTASKS = collection(db, 'subtasks');

/** 一覧購読（taskIdごと）— インデックス不要化のため orderBy は使わず、クライアント側で並び替え */
export function listenSubtasks(
  taskId: string,
  cb: (list: Subtask[]) => void
): Unsubscribe {
  const q = query(
    SUBTASKS,
    where('taskId', '==', taskId),
    where('deleted', '==', false)
  );

  return onSnapshot(q, (snap) => {
    const list: Subtask[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Subtask, 'id'>),
    }));

    // クライアント側で安定ソート（order ASC → createdAt DESC）
    list.sort((a: any, b: any) => {
      const o = (a.order ?? 0) - (b.order ?? 0);
      if (o !== 0) return o;
      const at = a.createdAt?.toMillis?.() ?? 0;
      const bt = b.createdAt?.toMillis?.() ?? 0;
      return bt - at;
    });

    cb(list);
  });
}

/** 追加 */
export async function createSubtask(
  taskId: string,
  title: string,
  note: string = '' // ← 追加
) {
  const t = (title ?? '').trim();
  if (!t) throw new Error('サブタスク名を入力してください');

  const ref = await addDoc(SUBTASKS, {
    taskId,
    title: t,
    note: note ?? '', // ← 追加
    done: false,
    deleted: false,
    order: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** 完了トグル（コンポーネントから使いやすい名前もエクスポート） */
// 完了トグル（コンポーネントから使いやすい名前もエクスポート）
export async function setSubtaskDone(id: string, done: boolean) {
  const subRef = doc(db, 'subtasks', id);
  const snap = await getDoc(subRef);
  if (!snap.exists()) return;

  const sub = snap.data() as any;
  const taskId: string | undefined = sub.taskId;

  const now = serverTimestamp();
  const batch = writeBatch(db);

  // まず対象サブタスク自身を更新
  batch.update(subRef, {
    done,
    updatedAt: now,
  });

  // 親タスクが分かる場合だけ親タスクも更新
  if (taskId) {
    // 親タスク配下の（削除されていない）サブタスクを全部取得
    const q = query(
      SUBTASKS,
      where('taskId', '==', taskId),
      where('deleted', '==', false)
    );
    const siblingsSnap = await getDocs(q);

    // 「自分を含む全サブタスクが完了か？」をチェック
    let allDone = true;
    siblingsSnap.forEach((d) => {
      const data = d.data() as any;
      const currentDone = d.id === id ? done : !!data.done;
      if (!currentDone) allDone = false;
    });

    const taskRef = doc(db, 'tasks', taskId);
    batch.update(taskRef, {
      status: allDone ? 'done' : 'today', // 全部完了なら done / 1つでも外れたら today
      completed: allDone,
      deletedFrom: null,
      trashedAt: null,
      updatedAt: now,
    });
  }

  await batch.commit();
}

// 互換用
export async function toggleSubtaskDone(id: string, next: boolean) {
  return setSubtaskDone(id, next);
}

/** 編集 */
export async function updateSubtask(
  id: string,
  patch: { title?: string; done?: boolean; note?: string } // ← note と done を許可
) {
  await updateDoc(doc(db, 'subtasks', id), {
    ...(patch.title !== undefined ? { title: (patch.title ?? '').trim() } : {}),
    ...(patch.done !== undefined ? { done: !!patch.done } : {}),
    ...(patch.note !== undefined ? { note: (patch.note ?? '').trim() } : {}),
    updatedAt: serverTimestamp(),
  });
}

/** 削除（ソフトデリート） */
export async function deleteSubtask(id: string) {
  await updateDoc(doc(db, 'subtasks', id), {
    deleted: true,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** 並び替え確定 */
export async function reorderSubtasks(idsOrdered: string[]) {
  const batch = writeBatch(db);
  idsOrdered.forEach((id, idx) => {
    batch.update(doc(db, 'subtasks', id), {
      order: idx,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

/** 親タスク配下を物理削除（必要なときだけ） */
export async function hardDeleteAllSubtasksOf(taskId: string) {
  const q = query(SUBTASKS, where('taskId', '==', taskId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}
