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

  for (const row of rows || []) {
    const htmlBody = `
      <p>${(row.body_text || "").replace(/\n/g, "<br>")}</p>
      ${row.link ? `<p><a href="${siteUrl}${row.link}">Открыть в BuildConnect</a></p>` : ""}
      <hr><p style="color:#888;font-size:12px">BuildConnect — уведомление с платформы</p>
    `;

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
