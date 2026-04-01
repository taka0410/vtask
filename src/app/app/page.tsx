'use client';

import AuthGate from '@/components/AuthGate';
import TaskBoard from '@/components/TaskBoard';
import DeletedTasksModal from '@/components/DeletedTasksModal';
import { CheckSquare } from 'lucide-react';
import UserMenu from '@/components/UserMenu';

import { TasksRepoProvider } from '@/contexts/TasksRepoContext';
import { TaskWriteRepoProvider } from '@/contexts/TaskWriteRepoContext';
import {
  firestoreTasksRepo,
  firestoreTaskWriteRepo,
} from '@/repos/firestoreTasksRepo';
import { SubtaskRepoProvider } from '@/contexts/SubtaskRepoContext';
import { firestoreSubtaskRepo } from '@/repos/firestoreSubtaskRepo';

<TasksRepoProvider repo={firestoreTasksRepo}>
  <TaskWriteRepoProvider repo={firestoreTaskWriteRepo}>
    <SubtaskRepoProvider repo={firestoreSubtaskRepo}>
      <TaskBoard />
    </SubtaskRepoProvider>
  </TaskWriteRepoProvider>
</TasksRepoProvider>;

export default function AppPage() {
  return (
    <AuthGate>
      <div className="min-h-screen">
        <header className="flex items-center justify-between p-4 border-b">
          <h1 className="font-bold text-xl text-indigo-600 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            Vitask
          </h1>

          <div className="flex items-center gap-3">
            <DeletedTasksModal />
            <UserMenu />
          </div>
        </header>

        <TasksRepoProvider repo={firestoreTasksRepo}>
          <TaskWriteRepoProvider repo={firestoreTaskWriteRepo}>
            <TaskBoard />
          </TaskWriteRepoProvider>
        </TasksRepoProvider>
      </div>
    </AuthGate>
  );
}
