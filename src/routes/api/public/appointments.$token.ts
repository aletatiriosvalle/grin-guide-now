import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Public token-based endpoint for patients to view, cancel, or request to
 * reschedule their appointment. Anonymous access is gated by the
 * cryptographically-random manage_token (UUID v4) — never by RLS.
 */
export const Route = createFileRoute("/api/public/appointments/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { data, error } = await supabaseAdmin
          .from("appointments")
          .select(
            "id, starts_at, duration_min, treatment, status, cancelled_at, reschedule_requested, patient:patients(full_name)",
          )
          .eq("manage_token", params.token)
          .maybeSingle();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        if (!data) return Response.json({ error: "not_found" }, { status: 404 });
        return Response.json({ appointment: data });
      },
      POST: async ({ params, request }) => {
        const body = (await request.json().catch(() => ({}))) as { action?: string };
        if (!body.action || !["cancel", "reschedule"].includes(body.action)) {
          return Response.json({ error: "invalid_action" }, { status: 400 });
        }

        const { data: existing } = await supabaseAdmin
          .from("appointments")
          .select("id, cancelled_at")
          .eq("manage_token", params.token)
          .maybeSingle();
        if (!existing) return Response.json({ error: "not_found" }, { status: 404 });
        if (existing.cancelled_at) {
          return Response.json({ error: "already_cancelled" }, { status: 409 });
        }

        const updates =
          body.action === "cancel"
            ? { status: "cancelled", cancelled_at: new Date().toISOString() }
            : { reschedule_requested: true };

        const { error } = await supabaseAdmin
          .from("appointments")
          .update(updates)
          .eq("manage_token", params.token);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});