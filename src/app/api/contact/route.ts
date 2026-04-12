import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_APP_PASSWORD!,
  },
});

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: 'invalid_input' },
        { status: 400 },
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

    await transporter.sendMail({
      from: `Vitask <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER!,
      replyTo: email,
      subject: '【Vitask】お問い合わせ',
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('contact_send_error', e);
    return NextResponse.json(
      { ok: false, error: 'mail_send_failed' },
      { status: 500 },
    );
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
