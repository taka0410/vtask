// src/app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300 text-lg font-bold">
              V
            </span>
            <span className="text-lg font-semibold tracking-tight">Vtask</span>
          </div>

          <Link
            href="/app"
            className="rounded-full border border-sky-500/60 bg-sky-500/10 px-4 py-2 text-sm font-medium hover:bg-sky-500/30 transition"
          >
            アプリを使ってみる
          </Link>
        </header>

        {/* Hero */}
        <section className="mb-12 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
            毎日のタスクを、
            <br />
            <span className="text-sky-300">シンプルに整理しよう。</span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base max-w-2xl mb-6">
            Vtask は、日々のタスクを直感的に管理できるシンプルなアプリです。
            PC・スマホどちらでも使いやすく、今日やるべきことに集中できます。
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm md:text-base font-semibold text-slate-950 shadow-md hover:bg-sky-400 transition"
            >
              今すぐ使ってみる（無料）
            </Link>
            <span className="text-xs md:text-sm text-slate-400">
              ログイン後から利用できます
            </span>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-4 md:grid-cols-3 mb-12">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-semibold mb-2 text-sky-200">
              シンプル操作
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              タスクの追加・編集・削除に加えて、ドラッグ＆ドロップで順番変更も直感的に行うことができ、やりたいことをスムーズに整理。
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-semibold mb-2 text-sky-200">
              サブタスク対応
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              大きなタスクを細かく分解して管理することができます。「どこまで進んだか」が一目でわかり、作業が進めやすくなります。
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-semibold mb-2 text-sky-200">
              ボード型3カラム管理
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              過去・現在・未来の3カラムでタスクを整理。タスクをドラッグしてステータスを変更でき、全体の進捗が一目で把握できます。
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Vtask. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
