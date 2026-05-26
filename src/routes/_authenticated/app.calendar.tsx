import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAppointments } from "@/lib/dental-data";
import { MiniCalendar } from "@/components/dental/MiniCalendar";
import { AppointmentDialog } from "@/components/dental/AppointmentDialog";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/app/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const { data: appts = [] } = useQuery({ queryKey: ["appointments"], queryFn: fetchAppointments });

  const selectedAppts = useMemo(
    () =>
      appts
        .filter((a) => isSameDay(new Date(a.starts_at), selected))
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [appts, selected],
  );

  const hours = Array.from({ length: 12 }, (_, i) => 8 + i);

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendario</h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">
            {format(selected, "EEEE d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <AppointmentDialog defaultDate={selected} />
      </header>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4 bg-card rounded-3xl p-6 border border-border/50 shadow-[var(--shadow-soft)]">
          <MiniCalendar
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={setSelected}
            hasAppointment={(d) => appts.some((a) => isSameDay(new Date(a.starts_at), d))}
          />
        </div>

        <div className="col-span-12 lg:col-span-8 bg-card rounded-3xl p-6 border border-border/50 shadow-[var(--shadow-soft)]">
          <h3 className="font-display text-lg font-semibold mb-4">Horario del día</h3>
          <div className="space-y-1">
            {hours.map((h) => {
              const slot = selectedAppts.filter((a) => new Date(a.starts_at).getHours() === h);
              return (
                <div key={h} className="grid grid-cols-[60px_1fr] gap-3 py-2 border-t border-border/40">
                  <div className="text-xs text-muted-foreground pt-1">{String(h).padStart(2, "0")}:00</div>
                  <div className="space-y-1">
                    {slot.length === 0 && <div className="h-6" />}
                    {slot.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-xl px-3 py-2 text-sm shadow-[var(--shadow-soft)]"
                        style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{format(new Date(a.starts_at), "HH:mm")} · {a.patient?.full_name}</span>
                          <Badge variant="outline" className="border-white/40 text-white/90 bg-white/10">
                            {a.duration_min}min
                          </Badge>
                        </div>
                        <div className="text-xs text-white/80 mt-0.5">{a.treatment}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}