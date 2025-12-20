'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // ← ここが確定！

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setChecked(true);
    });

    return () => unsub();
  }, [router]);

  // 認証状態チェック中は何も見せない（ちらつき防止）
  if (!checked) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-300">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
