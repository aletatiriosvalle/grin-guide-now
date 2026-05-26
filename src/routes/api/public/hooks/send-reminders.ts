import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Cron-triggered endpoint. Finds appointments starting in ~24h that have not
 * yet been reminded, "sends" a simulated email + WhatsApp message, and marks
 * reminder_sent_at so they aren't sent twice.
 *
 * In simulated mode every send is logged to the server console. Swap the
 * `simulateSend()` calls for real Resend / Twilio gateway calls when the
 * provider connections are added.
 */
export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: handle,
      GET: handle,
    },
  },
});

async function handle() {
  const now = new Date();
  // Window: appointments between now+23h and now+25h (so we cover 15-min cron cadence safely)
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabaseAdmin
    .from("appointments")
    .select("id, starts_at, treatment, manage_token, patient:patients(full_name, email, phone)")
    .is("reminder_sent_at", null)
    .is("cancelled_at", null)
    .gte("starts_at", windowStart)
    .lte("starts_at", windowEnd);

  if (error) {
    console.error("[reminders] query failed", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const baseUrl = process.env.SITE_URL ?? "https://grin-guide-now.lovable.app";
  const sent: Array<{ id: string; channels: string[] }> = [];

  for (const appt of rows ?? []) {
    const patient = (appt as any).patient as { full_name: string; email: string | null; phone: string | null } | null;
    if (!patient) continue;
    const manageUrl = `${baseUrl}/manage/${appt.manage_token}`;
    const channels: string[] = [];

    if (patient.email) {
      simulateSend("email", patient.email, {
        subject: `Recordatorio: tu cita es mañana`,
        body: `Hola ${patient.full_name}, te recordamos tu cita de ${appt.treatment} el ${formatDateEs(appt.starts_at)}. Para cancelar o reagendar: ${manageUrl}`,
      });
      channels.push("email");
    }
    if (patient.phone) {
      simulateSend("whatsapp", patient.phone, {
        body: `Hola ${patient.full_name} 👋 Te recordamos tu cita de ${appt.treatment} mañana ${formatDateEs(appt.starts_at)}. Cancelar/reagendar: ${manageUrl}`,
      });
      channels.push("whatsapp");
    }

    await supabaseAdmin
      .from("appointments")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", appt.id);

    sent.push({ id: appt.id, channels });
  }

  return Response.json({ ok: true, processed: sent.length, sent });
}

function simulateSend(channel: "email" | "whatsapp", to: string, payload: { subject?: string; body: string }) {
  console.log(`[reminders][SIMULATED ${channel.toUpperCase()}] → ${to}`, payload);
}

function formatDateEs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}