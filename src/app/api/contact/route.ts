import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: 'invalid_input' },
        { status: 400 }
      );
    }

    const html = `
      <h2>お問い合わせが届きました</h2>
      <p><b>お名前:</b> ${escapeHtml(name)}</p>
      <p><b>メール:</b> ${escapeHtml(email)}</p>
      <p><b>本文:</b><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      <hr>
      <p>送信日時: ${new Date().toLocaleString('ja-JP')}</p>
    `;

    await resend.emails.send({
      from: process.env.MAIL_FROM!,
      to: process.env.MAIL_TO!,
      replyTo: email, // 返信ボタンで送信者へ返せる
      subject: '【Vtask】お問い合わせ',
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('contact_send_error', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// XSS対策の簡易エスケープ
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
