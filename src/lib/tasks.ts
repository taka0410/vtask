'use client';

import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteDoc,
  Timestamp,
  writeBatch,
  limit,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Priority, Status, Task } from '@/types/task';
import { getDevUserId } from './devUser';
import { hardDeleteAllSubtasksOf } from './subtasks'; // 使っていなければ削除可

// すべての操作対象
const col = collection(db, 'tasks');

/* ========== 追加（新規タスク） ========== */
export async function createTask(input: {
  title: string;
  priority: Priority;
  note?: string;
  status?: Status; // 'planned' | 'today' | 'done'
}) {
  const uid = getDevUserId();
  const title = (input.title ?? '').trim();
  if (!title) throw new Error('タイトルを入力してください');

  const ref = await addDoc(col, {
    title,
    priority: input.priority,
    note: input.note ?? '',
    status: input.status ?? 'today',
    userId: uid,
    order: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    // 旧 deleted フラグは使わず、status='trash' に統一します
  });

  console.log('[CREATE ok]', ref.id);
  return ref.id;
}

/* ========== ステータス移動/完了トグル ========== */
export async function moveTask(
  id: string,
  dest: 'planned' | 'today' | 'done'
): Promise<void> {
  const ref = doc(db, 'tasks', id);
  await updateDoc(ref, {
    status: dest,
    deletedFrom: null,
    trashedAt: null,
    completed: dest === 'done',
    updatedAt: serverTimestamp(),
  });
}

// 完了トグル
export async function toggleDone(task: Task) {
  const toDone = task.status !== 'done'; // true なら完了側へ、false なら未完側へ
  const newStatus: Status = toDone ? 'done' : 'today';

  const now = serverTimestamp();
  const batch = writeBatch(db);

  const taskRef = doc(db, 'tasks', task.id);

  // 親タスク本体を更新
  batch.update(taskRef, {
    status: newStatus,
    deletedFrom: null,
    trashedAt: null,
    completed: toDone,
    updatedAt: now,
  });

  // 配下のサブタスクを一括で done / 未完 に揃える
  const qy = query(
    collection(db, 'subtasks'),
    where('taskId', '==', task.id),
    where('deleted', '==', false)
  );
  const snap = await getDocs(qy);

  snap.forEach((d) => {
    batch.update(d.ref, {
      done: toDone,
      updatedAt: now,
    });
  });

  await batch.commit();
}

/* ========== 購読（3カラム） ========== */
/**
 * 表示用の購読は status で分岐します。
 * Firestore の orderBy（複合インデックス）問題を避けるため、
 * 並び替えはクライアント側で実施します。
 */
export function listenTasks(
  status: Status,
  cb: (tasks: Task[]) => void
): Unsubscribe {
  const uid = getDevUserId();
  const qy = query(
    col,
    where('userId', '==', uid),
    where('status', '==', status)
  );

  return onSnapshot(qy, (snap) => {
    const list: Task[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    // クライアント側で安定ソート：order ASC → createdAt DESC
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

/* ========== ゴミ箱（削除済み）関連 ========== */
/** ステータス内で「削除」→ ゴミ箱へ移動（soft delete） */
export async function softDeleteTask(t: Task): Promise<void> {
  await updateDoc(doc(db, 'tasks', t.id), {
    status: 'trash',
    trashedAt: serverTimestamp(),
    deletedFrom: t.status ?? 'today', // 復元先を記録
    updatedAt: serverTimestamp(),
  });
}

/** ゴミ箱 → 復元（元のステータスへ） */
export async function restoreTask(t: Task): Promise<void> {
  const backTo: Status = (t as any).deletedFrom ?? 'today';
  await updateDoc(doc(db, 'tasks', t.id), {
    status: backTo,
    deletedFrom: null,
    trashedAt: null,
    updatedAt: serverTimestamp(),
  });
}

/** ゴミ箱から完全削除（物理削除） */
export async function hardDeleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, 'tasks', id));
  // サブタスクを運用している場合は同時に物理削除（未使用なら try/catch を削除可）
  try {
    await hardDeleteAllSubtasksOf(id);
  } catch {
    /* no-op */
  }
}

/** ゴミ箱（status === 'trash'）だけを購読 */
export function listenTrash(cb: (tasks: Task[]) => void): Unsubscribe {
  const uid = getDevUserId();
  const qy = query(
    col,
    where('userId', '==', uid),
    where('status', '==', 'trash')
  );
  return onSnapshot(qy, (snap) => {
    const list: Task[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
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

/** 完了カラムのタスクを一括でゴミ箱へ（“削除済みへ移動”） */
export async function trashAllDoneTasks(): Promise<number> {
  const qy = query(col, where('status', '==', 'done'));
  const snap = await getDocs(qy);
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.forEach((d) => {
    const ref = doc(db, 'tasks', d.id);
    batch.update(ref, {
      status: 'trash',
      trashedAt: serverTimestamp(),
      deletedFrom: 'done',
      order: 0,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return snap.size;
}

/** 指定IDのタスクだけゴミ箱へ移動（“削除済みへ”） */
export async function trashDoneByIds(ids: string[]): Promise<number> {
  if (!ids.length) return 0;

  const batch = writeBatch(db);
  for (const id of ids) {
    const ref = doc(db, 'tasks', id);
    batch.update(ref, {
      status: 'trash',
      trashedAt: serverTimestamp(),
      deletedFrom: 'done',
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return ids.length;
}

/** ゴミ箱を“完全削除”で空にする（物理削除） */
export async function purgeAllTrash(): Promise<number> {
  const qy = query(col, where('status', '==', 'trash'), limit(500));
  const snap = await getDocs(qy);
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(doc(db, 'tasks', d.id)));
  await batch.commit();
  return snap.size;
}

/* ========== 並び替え/編集系（そのまま使えます） ========== */
export async function reorderColumnByIds(ids: string[]) {
  const batch = writeBatch(db);
  ids.forEach((id, idx) => {
    batch.update(doc(db, 'tasks', id), {
      order: idx,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function moveAndReorder(
  taskId: string,
  newStatus: Status,
  destIdsOrdered: string[],
  srcIdsOrdered?: string[]
) {
  const batch = writeBatch(db);

  // ステータス変更
  batch.update(doc(db, 'tasks', taskId), {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });

  // 目的地の order を振る
  destIdsOrdered.forEach((id, idx) => {
    batch.update(doc(db, 'tasks', id), {
      order: idx,
      updatedAt: serverTimestamp(),
    });
  });

  // 移動元も渡ってきたら order を確定
  if (srcIdsOrdered) {
    srcIdsOrdered.forEach((id, idx) => {
      batch.update(doc(db, 'tasks', id), {
        order: idx,
        updatedAt: serverTimestamp(),
      });
    });
  }

  await batch.commit();
}

export async function updateTask(
  taskId: string,
  patch: { title?: string; priority?: Priority; note?: string }
) {
  await updateDoc(doc(db, 'tasks', taskId), {
    ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.note !== undefined ? { note: patch.note ?? '' } : {}),
    updatedAt: serverTimestamp(),
  });
}

/** ユーティリティ：いま「完了」にいるタスクのIDを取得（必要なら） */
export async function fetchDoneTaskIds(): Promise<string[]> {
  const qy = query(col, where('status', '==', 'done'));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => d.id);
}

// 自動削除フラグを取得
export function getAutoPurgeFlag(): boolean {
  if (typeof window === 'undefined') return false; // SSR対策
  return localStorage.getItem('autoPurge') === 'true';
}

// 自動削除フラグをセット
export function setAutoPurgeFlag(value: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('autoPurge', value ? 'true' : 'false');
}

// ゴミ箱内で3か月以上前のタスクを完全削除
export async function purgeOldDeletedIfAutoOn() {
  if (!getAutoPurgeFlag()) return; // フラグOFFなら何もしない

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const q = query(
    collection(db, 'tasks'),
    where('status', '==', 'trash'),
    where('trashedAt', '<', threeMonthsAgo)
  );

  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(doc(db, 'tasks', d.id));
  }
}
