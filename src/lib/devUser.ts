// 開発用の仮ユーザーIDを localStorage に保存して使う
export function getDevUserId(): string {
  if (typeof window === 'undefined') return 'dev-server'; // SSR保険
  let id = localStorage.getItem('devUserId');
  if (!id) {
    id = 'dev-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('devUserId', id);
  }
  return id;
}
