import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/manage/$token")({
  component: ManagePage,
});

type Appointment = {
  id: string;
  starts_at: string;
  duration_min: number;
  treatment: string;
  status: string;
  cancelled_at: string | null;
  reschedule_requested: boolean;
  patient: { full_name: string } | null;
};

function ManagePage() {
  const { token } = Route.useParams();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/appointments/${token}`);
      if (!res.ok) {
        setError(res.status === 404 ? "Link inválido o expirado" : "No pudimos cargar tu cita");
        return;
      }
      const data = await res.json();
      setAppt(data.appointment);
      setError(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function act(action: "cancel" | "reschedule") {
    setBusy(true);
    try {
      const res = await fetch(`/api/public/appointments/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "No se pudo procesar");
        return;
      }
      toast.success(
        action === "cancel" ? "Tu cita fue cancelada" : "Solicitud de reagendamiento enviada",
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-3xl p-8 border border-border/50 shadow-[var(--shadow-soft)]">
        <h1 className="font-display text-2xl font-bold mb-1">Tu cita</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Gestiona tu próxima visita a la clínica.
        </p>

        {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {appt && (
          <div className="space-y-5">
            <div className="rounded-2xl p-5" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}>
              <p className="text-xs uppercase tracking-wide opacity-80">Paciente</p>
              <p className="font-semibold text-lg">{appt.patient?.full_name ?? "—"}</p>
              <p className="text-xs uppercase tracking-wide opacity-80 mt-3">Tratamiento</p>
              <p className="font-semibold">{appt.treatment}</p>
              <p className="text-xs uppercase tracking-wide opacity-80 mt-3">Fecha</p>
              <p className="font-semibold">
                {new Date(appt.starts_at).toLocaleString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-xs opacity-80 mt-1">{appt.duration_min} min</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {appt.cancelled_at && <Badge variant="destructive">Cancelada</Badge>}
              {appt.reschedule_requested && !appt.cancelled_at && (
                <Badge variant="secondary">Reagendamiento solicitado</Badge>
              )}
              {!appt.cancelled_at && !appt.reschedule_requested && (
                <Badge variant="outline">Confirmada</Badge>
              )}
            </div>

            {!appt.cancelled_at && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={busy || appt.reschedule_requested}
                  onClick={() => act("reschedule")}
                >
                  Reagendar
                </Button>
                <Button variant="destructive" disabled={busy} onClick={() => act("cancel")}>
                  Cancelar cita
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              ¿Dudas? Comunícate con el consultorio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}