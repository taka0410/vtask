'use client';

import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // 相対にするなら '../lib/firebase'
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState<string>('ゲスト');
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user: User | null) => {
      const name = user?.displayName || user?.email || 'ゲスト';
      setUserName(name);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (err) {
      console.error('ログアウトエラー:', err);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded px-3 py-1 bg-white/10 hover:bg-white/20 text-gray-200 cursor-pointer"
        title={userName}
      >
        <span className="max-w-[14rem] truncate">{userName}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
        </svg>
      </button>

      <div
        role="menu"
        aria-label="ユーザーメニュー"
        className={`absolute right-0 mt-2 w-44 rounded border bg-white text-gray-800 shadow transition
          ${
            open
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
      >
        <button
          role="menuitem"
          onClick={() => {
            router.push('/contact');
            setOpen(false);
          }}
          className="w-full px-4 py-2 text-left rounded hover:bg-gray-100 cursor-pointer"
        >
          お問い合わせ
        </button>
        <button
          role="menuitem"
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left rounded hover:bg-gray-100 cursor-pointer"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
