'use client';

import { useEffect } from 'react';
import TaskBoard from '@/components/TaskBoard';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { TasksRepoProvider } from '@/contexts/TasksRepoContext';
import {
  createGuestTasksRepo,
  createGuestTaskWriteRepo,
} from '@/repos/guestTasksRepo';
import { TaskWriteRepoProvider } from '@/contexts/TaskWriteRepoContext';
import { SubtaskRepoProvider } from '@/contexts/SubtaskRepoContext';
import { guestSubtaskRepo } from '@/repos/guestSubtaskRepo';

const guestRepo = createGuestTasksRepo();
const guestWriteRepo = createGuestTaskWriteRepo();

<TasksRepoProvider repo={guestRepo}>
  <TaskWriteRepoProvider repo={guestWriteRepo}>
    <SubtaskRepoProvider repo={guestSubtaskRepo}>
      <TaskBoard />
    </SubtaskRepoProvider>
  </TaskWriteRepoProvider>
</TasksRepoProvider>;

function GuestScreen() {
  const { setIsGuest } = useAuth();

  useEffect(() => {
    setIsGuest(true);
    return () => setIsGuest(false);
  }, [setIsGuest]);

  return (
    <TasksRepoProvider repo={guestRepo}>
      <TaskWriteRepoProvider repo={guestWriteRepo}>
        <TaskBoard />
      </TaskWriteRepoProvider>
    </TasksRepoProvider>
  );
}

export default function GuestPage() {
  return (
    <AuthProvider>
      <GuestScreen />
    </AuthProvider>
  );
}
