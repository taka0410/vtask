# タスク管理アプリ — CLAUDE.md

## プロジェクト概要

シンプルなタスク管理アプリ。ゲストモード対応、ログイン/新規登録のタブ切り替えUIを持つ。

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js (App Router) |
| 言語 | TypeScript |
| UIライブラリ | React |
| スタイリング | Tailwind CSS |
| 認証 | Firebase Authentication |
| DB | Cloud Firestore |
| SDK | Firebase SDK |

---

## 主要ファイル

```
src/
└── app/
    └── login/
        └── page.tsx   # ログイン/新規登録ページ（タブUI）
    └── app/
        └── ...        # ログイン後のメイン画面
```

---

## セッション⑨ 完了済み作業

### `src/app/login/page.tsx` — タブUIの二重ボーダー修正

**問題:** タブとフォームのボーダーが独立していて二重に見えていた。

**修正内容:**

1. **アクティブタブの下ボーダーを透明化**
   ```tsx
   // アクティブ時に border-b-transparent を追加
   mode === 'login'
     ? 'bg-violet-600 text-white border-violet-500 border-b-transparent'
     : 'bg-neutral-900 text-neutral-300 border-neutral-600 hover:bg-neutral-800'
   ```

2. **タブコンテナの gap を 0 に**
   ```tsx
   <div className="mb-0 grid grid-cols-2 gap-0 px-1">
   ```

3. **フォームの上ボーダーを削除・角丸を調整**
   ```tsx
   className="flex flex-col gap-4 border border-neutral-700 border-t-0 rounded-b-2xl p-4"
   ```

---

## 次のステップ

- [ ] **ログイン済みの場合、`/app` へ自動リダイレクト**
  - Firebase Auth の `onAuthStateChanged` を使って判定
  - 未ログインなら `/login` に留まる、ログイン済みなら `/app` へ

---

## 開発メモ

- ダークモードUI前提のデザイン
- Tailwind のユーティリティクラスで完結させる方針
