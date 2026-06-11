// Supabase Edge Function: отправка email из очереди email_outbox (Resend API)
// Деплой: supabase functions deploy send-notification-email
// Secrets: RESEND_API_KEY, EMAIL_FROM (например noreply@yourdomain.com)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "BuildConnect <onboarding@resend.dev>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: rows, error } = await supabase
    .from("email_outbox")
    .select("id, recipient_email, subject, body_text, link")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  const siteUrl = Deno.env.get("SITE_URL") || "https://build-connect-market.vercel.app";

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildEmailHtml(subject: string, bodyText: string, link: string | null): string {
    const safeSubject = escapeHtml(subject);
    const bodyHtml = escapeHtml(bodyText || "").replace(/\n/g, "<br>");
    const actionUrl = link ? `${siteUrl}${link}` : siteUrl;

    return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Segoe UI,Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="background:#ea580c;padding:20px 24px;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">BuildConnect</p>
          <p style="margin:6px 0 0;font-size:13px;color:#ffedd5;">B2B-маркетплейс строительства · Казахстан</p>
        </td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.04em;">Уведомление</p>
          <h1 style="margin:0 0 16px;font-size:20px;line-height:1.35;color:#18181b;">${safeSubject}</h1>
          <div style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3f3f46;">${bodyHtml || "Откройте платформу, чтобы посмотреть детали."}</div>
          <a href="${actionUrl}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">Открыть в BuildConnect</a>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#fafafa;border-top:1px solid #e4e4e7;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;">Вы получили это письмо, потому что у вас включены уведомления BuildConnect.<br>
          <a href="${siteUrl}" style="color:#ea580c;text-decoration:none;">${siteUrl.replace(/^https?:\/\//, "")}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  for (const row of rows || []) {
    const htmlBody = buildEmailHtml(row.subject, row.body_text || "", row.link);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: row.recipient_email,
        subject: row.subject,
        html: htmlBody,
      }),
    });

    if (res.ok) {
      await supabase
        .from("email_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
      sent++;
    } else {
      const errText = await res.text();
      await supabase
        .from("email_outbox")
        .update({ status: "failed", error_message: errText.slice(0, 500) })
        .eq("id", row.id);
    }
  }

  return new Response(JSON.stringify({ processed: rows?.length ?? 0, sent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
