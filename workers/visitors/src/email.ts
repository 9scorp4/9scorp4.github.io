import type { VisitorMessage } from './schema';

interface EmailEnv {
  RESEND_API_KEY: string;
  OWNER_EMAIL: string;
}

export async function sendNotification(
  message: VisitorMessage,
  env: EmailEnv,
  workerUrl: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'El Jardín <onboarding@resend.dev>',
        to: env.OWNER_EMAIL,
        subject: `[jardín] nueva nota de ${message.nombre}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4a5d23; margin-bottom: 20px;">Nueva nota en el jardín</h2>

            <div style="background: #faf6f1; border-left: 3px solid #4a5d23; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #333;">${escapeHtml(message.nombre)}</p>
              <p style="margin: 0; color: #555; font-style: italic;">"${escapeHtml(message.mensaje)}"</p>
            </div>

            <p style="color: #666; font-size: 14px;">
              ID: <code style="background: #eee; padding: 2px 6px; border-radius: 3px;">${message.id}</code><br>
              Timestamp: ${message.timestamp}
            </p>

            <p style="margin-top: 24px; color: #888; font-size: 13px;">
              Aprobar: <code>npx tsx scripts/visitors-admin.ts approve ${message.id}</code>
            </p>
          </div>
        `,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
