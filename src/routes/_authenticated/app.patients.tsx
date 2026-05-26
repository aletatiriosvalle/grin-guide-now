import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePatient, fetchPatients } from "@/lib/dental-data";
import { PatientDialog } from "@/components/dental/PatientDialog";
import { Trash2, Mail, Phone, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/patients")({
  component: PatientsPage,
});

function PatientsPage() {
  const { data = [] } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      toast.success("Paciente eliminado");
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{data.length} registrados</p>
        </div>
        <PatientDialog />
      </header>

      {data.length === 0 ? (
        <div className="rounded-3xl bg-card border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Aún no hay pacientes. Crea el primero.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((p) => (
            <div key={p.id} className="bg-card rounded-2xl p-5 border border-border/50 shadow-[var(--shadow-soft)]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-lg">{p.full_name}</h3>
                  {p.date_of_birth && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <CalendarDays className="size-3" /> {format(new Date(p.date_of_birth), "dd/MM/yyyy")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { if (confirm(`Eliminar a ${p.full_name}?`)) del.mutate(p.id); }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                {p.phone && <div className="flex items-center gap-2"><Phone className="size-3" /> {p.phone}</div>}
                {p.email && <div className="flex items-center gap-2"><Mail className="size-3" /> {p.email}</div>}
              </div>
              {p.notes && <p className="mt-3 text-sm text-foreground/80 line-clamp-2">{p.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}