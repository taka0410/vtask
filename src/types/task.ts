export type Priority = '高' | '中' | '低';
export type Status = 'planned' | 'today' | 'done' | 'deleted';

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  note?: string;
  status: Status;
  userId: string;
  order?: number;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any;

  // ← これを追加（削除前に居た列を記録）
  prevStatus?: Status;
};
