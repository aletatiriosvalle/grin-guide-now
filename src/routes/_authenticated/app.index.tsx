import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAppointments, fetchPatients, updateAppointmentStatus, deleteAppointment } from "@/lib/dental-data";
import { AppointmentDialog } from "@/components/dental/AppointmentDialog";
import { PatientDialog } from "@/components/dental/PatientDialog";
import { MiniCalendar } from "@/components/dental/MiniCalendar";
import { format, isSameDay, isToday, isAfter, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, CalendarCheck2, Clock, Users, CheckCircle2, XCircle, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

function Dashboard() {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const qc = useQueryClient();

  const { data: appts = [] } = useQuery({ queryKey: ["appointments"], queryFn: fetchAppointments });
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });

  const todayAppts = useMemo(
    () => appts.filter((a) => isToday(new Date(a.starts_at))),
    [appts],
  );
  const selectedAppts = useMemo(
    () =>
      appts
        .filter((a) => isSameDay(new Date(a.starts_at), selected))
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [appts, selected],
  );
  const upcoming = useMemo(
    () =>
      appts
        .filter((a) => isAfter(new Date(a.starts_at), startOfDay(new Date())) && a.status === "scheduled")
        .slice(0, 5),
    [appts],
  );

  const hasAppointment = (d: Date) => appts.some((a) => isSameDay(new Date(a.starts_at), d));

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAppointmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      toast.success("Cita eliminada");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold mt-1">Buen día, doctora</h1>
        </div>
        <div className="flex gap-2">
          <PatientDialog />
          <AppointmentDialog />
        </div>
      </header>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-4 auto-rows-min">
        {/* Stats */}
        <StatCard
          className="col-span-12 sm:col-span-6 lg:col-span-3"
          label="Citas hoy"
          value={todayAppts.length}
          icon={<CalendarCheck2 className="size-5" />}
          tone="primary"
        />
        <StatCard
          className="col-span-6 lg:col-span-3"
          label="Pacientes"
          value={patients.length}
          icon={<Users className="size-5" />}
        />
        <StatCard
          className="col-span-6 lg:col-span-3"
          label="Próximas"
          value={upcoming.length}
          icon={<Clock className="size-5" />}
        />
        <StatCard
          className="col-span-12 lg:col-span-3"
          label="Atendidas"
          value={appts.filter((a) => a.status === "done").length}
          icon={<Activity className="size-5" />}
        />

        {/* Calendar */}
        <div className="col-span-12 lg:col-span-7 bg-card rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-border/50">
          <MiniCalendar
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={setSelected}
            hasAppointment={hasAppointment}
          />
        </div>

        {/* Selected day's agenda */}
        <div className="col-span-12 lg:col-span-5 bg-card rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Agenda</p>
              <h3 className="font-display text-lg font-semibold capitalize">
                {format(selected, "EEEE d MMM", { locale: es })}
              </h3>
            </div>
            <AppointmentDialog
              defaultDate={selected}
              trigger={<Button size="sm" variant="outline">+ Cita</Button>}
            />
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {selectedAppts.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin citas este día.</p>
            )}
            {selectedAppts.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="text-center min-w-[56px]">
                  <div className="text-sm font-semibold text-primary">
                    {format(new Date(a.starts_at), "HH:mm")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{a.duration_min}min</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{a.patient?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.treatment}</div>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {a.status === "done" ? "Atendida" : a.status === "cancelled" ? "Cancelada" : "Agendada"}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  {a.status === "scheduled" && (
                    <button
                      onClick={() => statusMut.mutate({ id: a.id, status: "done" })}
                      className="text-muted-foreground hover:text-primary"
                      title="Marcar atendida"
                    >
                      <CheckCircle2 className="size-4" />
                    </button>
                  )}
                  {a.status === "scheduled" && (
                    <button
                      onClick={() => statusMut.mutate({ id: a.id, status: "cancelled" })}
                      className="text-muted-foreground hover:text-destructive"
                      title="Cancelar"
                    >
                      <XCircle className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMut.mutate(a.id)}
                    className="text-muted-foreground hover:text-destructive"
                    title="Eliminar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero card */}
        <div
          className="col-span-12 lg:col-span-7 rounded-3xl p-8 text-[color:var(--primary-foreground)] shadow-[var(--shadow-elegant)] relative overflow-hidden"
          style={{ background: "var(--gradient-deep)" }}
        >
          <Sparkles className="absolute -right-6 -bottom-6 size-40 text-white/5" />
          <p className="text-xs uppercase tracking-widest text-white/60">Resumen</p>
          <h3 className="font-display text-2xl font-semibold mt-2 max-w-md">
            {todayAppts.length === 0
              ? "Sin citas hoy. Aprovecha para organizar tu consulta."
              : `Tienes ${todayAppts.length} ${todayAppts.length === 1 ? "cita" : "citas"} para hoy.`}
          </h3>
          {todayAppts[0] && (
            <p className="mt-4 text-sm text-white/70">
              Próxima: <span className="text-white font-medium">
                {format(new Date(todayAppts[0].starts_at), "HH:mm")} · {todayAppts[0].patient?.full_name}
              </span>{" "}
              — {todayAppts[0].treatment}
            </p>
          )}
        </div>

        {/* Upcoming */}
        <div className="col-span-12 lg:col-span-5 bg-card rounded-3xl p-6 shadow-[var(--shadow-soft)] border border-border/50">
          <h3 className="font-display text-lg font-semibold mb-4">Próximas citas</h3>
          <div className="space-y-3">
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay citas programadas.</p>
            )}
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <div className="size-10 rounded-xl bg-accent grid place-items-center text-xs font-semibold text-accent-foreground">
                  {format(new Date(a.starts_at), "dd")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{a.patient?.full_name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {format(new Date(a.starts_at), "d MMM, HH:mm", { locale: es })} · {a.treatment}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  className,
  label,
  value,
  icon,
  tone,
}: {
  className?: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "primary";
}) {
  return (
    <div
      className={`${className} rounded-3xl p-5 border border-border/50 shadow-[var(--shadow-soft)] ${
        tone === "primary"
          ? "text-[color:var(--primary-foreground)]"
          : "bg-card"
      }`}
      style={tone === "primary" ? { background: "var(--gradient-primary)" } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs uppercase tracking-wide ${tone === "primary" ? "text-white/80" : "text-muted-foreground"}`}>
          {label}
        </span>
        <span className={tone === "primary" ? "text-white/90" : "text-primary"}>{icon}</span>
      </div>
      <div className="mt-3 text-3xl font-bold font-display">{value}</div>
    </div>
  );
}