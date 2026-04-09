// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, pw);
      } else {
        await createUserWithEmailAndPassword(auth, email, pw);
      }

      router.push('/app');
    } catch (e: any) {
      setError(e?.message ?? '認証に失敗しました');
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
        <h1 className="text-3xl font-extrabold text-center mb-6">Vitask</h1>

        <div className="mb-0 grid grid-cols-2 gap-0">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-t-md rounded-b-none border py-2 text-sm font-semibold cursor-pointer transition ${
              mode === 'login'
                ? 'bg-violet-600 text-white border-violet-500 border-b-transparent'
                : 'bg-neutral-900 text-neutral-300 border-neutral-600 hover:bg-neutral-800'
            }`}
          >
            ログイン
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`rounded-t-md rounded-b-none border py-2 text-sm font-semibold cursor-pointer transition ${
              mode === 'signup'
                ? 'bg-violet-600 text-white border-violet-500 border-b-transparent'
                : 'bg-neutral-900 text-neutral-300 border-neutral-600 hover:bg-neutral-800'
            }`}
          >
            新規登録
          </button>
        </div>

        <form
          onSubmit={onEmailSubmit}
          className="flex flex-col gap-4 border border-neutral-700 border-t-0 rounded-b-2xl p-4"
        >
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
            {loading
              ? '処理中…'
              : mode === 'login'
                ? 'メールアドレスでログイン'
                : 'メールアドレスで新規登録'}
          </button>
        </form>

        {mode === 'login' && (
          <>
            <div className="my-4 text-center text-sm text-neutral-400">
              または
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={onGoogleLogin}
              className="w-full border border-neutral-600 hover:bg-neutral-800 disabled:opacity-60 text-white font-semibold py-2 rounded-md cursor-pointer transition"
            >
              Googleでログイン
            </button>
          </>
        )}

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
