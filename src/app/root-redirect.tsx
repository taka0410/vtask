'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // ← ログイン後に見せたい自分のメイン画面のパスに変更してください
      const appHome = '/app'; // 例: '/board' や '/' でもOK

      if (user) router.replace(appHome);
      else router.replace('/login');
    });
    return () => unsub();
  }, [router]);

  // 画面は何も描画しない（瞬間的に空白でOK）
  return null;
}
