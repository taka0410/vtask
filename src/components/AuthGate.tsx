'use client';
// 開発中は認証チェックを行わず、そのまま表示
export default function AuthGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
