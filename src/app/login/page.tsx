// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // まずはサインイン、未登録なら自動サインアップ（任意）
      await signInWithEmailAndPassword(auth, email, pw).catch(async (err) => {
        if (err.code === 'auth/user-not-found') {
          await createUserWithEmailAndPassword(auth, email, pw);
        } else {
          throw err;
        }
      });
      router.push('/'); // ログイン後のトップへ
    } catch (e: any) {
      setError(e?.message ?? 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/app');
    } catch (e: any) {
      setError(e?.message ?? 'Googleログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-6">
      <div className="bg-neutral-800/40 border border-neutral-700 rounded-2xl w-[min(440px,92vw)] p-8 shadow-xl">
        <h1 className="text-3xl font-extrabold text-center mb-6">Vtask</h1>

        <form onSubmit={onEmailLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="email@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-neutral-900 border border-neutral-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            required
          />
          <input
            type="password"
            placeholder="パスワード（6文字以上）"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full rounded-md bg-neutral-900 border border-neutral-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            minLength={6}
            required
          />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold py-2 rounded-md cursor-pointer transition"
          >
            {loading ? '処理中…' : 'メールアドレスでログイン'}
          </button>
        </form>

        <div className="my-4 text-center text-sm text-neutral-400">または</div>

        <button
          type="button"
          disabled={loading}
          onClick={onGoogleLogin}
          className="w-full border border-neutral-600 hover:bg-neutral-800 disabled:opacity-60 text-white font-semibold py-2 rounded-md cursor-pointer transition"
        >
          Googleでログイン
        </button>

        {/* 開発用ゲストボタン（必要なら） */}
        {/* <button
          type="button"
          onClick={() => router.push('/')}
          className="w-full mt-3 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-md"
        >
          ゲストで使う（開発用）
        </button> */}
      </div>
    </div>
  );
}
