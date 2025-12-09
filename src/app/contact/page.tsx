'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ContactPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(`送信に失敗しました: ${body?.error ?? res.statusText}`);
        return;
      }
      alert('送信しました。返信までしばらくお待ちください。');
      setName('');
      setEmail('');
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-6">
      <div className="bg-white text-neutral-900 rounded-xl shadow-lg w-[min(600px,90vw)] p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          お問い合わせ
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* お名前 */}
          <div>
            <label className="block mb-2 font-medium">お名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block mb-2 font-medium">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* お問い合わせ内容 */}
          <div>
            <label className="block mb-2 font-medium">お問い合わせ内容</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 h-32 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="mt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium cursor-pointer transition-colors"
            >
              戻る
            </button>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="mt-2 bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
          >
            {sending ? '送信中…' : '送信する'}
          </button>
        </form>
      </div>
    </div>
  );
}
