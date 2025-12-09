export type Subtask = {
  id: string;
  parentId: string; // 親タスクID
  title: string;
  done: boolean;
  order: number; // 並び順（0,1,2...）
  note?: string;
  createdAt?: any;
  updatedAt?: any;
};
