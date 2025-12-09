'use client';

import AuthGate from '@/components/AuthGate';
import TaskBoard from '@/components/TaskBoard';
import DeletedTasksModal from '@/components/DeletedTasksModal';
import { CheckSquare } from 'lucide-react';
import UserMenu from '@/components/UserMenu'; // 相対パスなら '../components/UserMenu'

export default function AppPage() {
  return (
    <AuthGate>
      <div className="min-h-screen">
        <header className="flex items-center justify-between p-4 border-b">
          <h1 className="font-bold text-xl text-indigo-600 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            Vtask
          </h1>

          <div className="flex items-center gap-3">
            <DeletedTasksModal />
            <UserMenu />
          </div>
        </header>

        {/* ← これだけで DnD 対応の3カラム */}
        <TaskBoard />
      </div>
    </AuthGate>
  );
}
