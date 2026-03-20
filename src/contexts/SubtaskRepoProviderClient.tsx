'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';

import {
  SubtaskRepoProvider,
  type SubtaskRepo,
} from '@/contexts/SubtaskRepoContext';

import { firestoreSubtaskRepo } from '@/repos/firestoreSubtaskRepo';
import { guestSubtaskRepo } from '@/repos/guestSubtaskRepo';

export function SubtaskRepoProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isGuest = pathname?.startsWith('/guest') ?? false;

  const repo: SubtaskRepo = useMemo(() => {
    return isGuest ? guestSubtaskRepo : firestoreSubtaskRepo;
  }, [isGuest]);

  return <SubtaskRepoProvider repo={repo}>{children}</SubtaskRepoProvider>;
}
