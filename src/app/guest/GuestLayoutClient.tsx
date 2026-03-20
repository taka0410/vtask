'use client';

import { GuestProvider } from './GuestProvider';

export default function GuestLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestProvider>
      {/* ここにバナー入れると“誤解防止”できる（任意） */}
      <div className="pointer-events-none fixed top-3 left-1/2 -translate-x-1/2 z-50">
        <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur">
          ゲストモード：保存されません
        </div>
      </div>

      {children}
    </GuestProvider>
  );
}
