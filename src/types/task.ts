export type Priority = '高' | '中' | '低';
export type Status = 'planned' | 'today' | 'done' | 'deleted';

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  note?: string;
  status: Status;
  uid: string;
  order?: number;
  createdAt?: any;
  updatedAt?: any;
  trashedAt?: any;
  deletedFrom?: Exclude<Status, 'deleted'>;
  subtasks?: SubTask[];
};

export type SubTask = {
  id: string;
  title: string;
  done: boolean;
};
