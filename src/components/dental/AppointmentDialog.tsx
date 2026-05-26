import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAppointment, fetchPatients } from "@/lib/dental-data";
import { toast } from "sonner";
import { format } from "date-fns";

export function AppointmentDialog({
  trigger,
  defaultDate,
}: {
  trigger?: React.ReactNode;
  defaultDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { data: patients = [] } = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });

  const initialDate = defaultDate ?? new Date();
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(format(initialDate, "yyyy-MM-dd"));
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const starts = new Date(`${date}T${time}`);
      await createAppointment({
        patient_id: patientId,
        starts_at: starts.toISOString(),
        duration_min: duration,
        treatment,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      toast.success("Cita agendada");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setOpen(false);
      setTreatment("");
      setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4 mr-1" /> Nueva cita
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar cita</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!patientId) return toast.error("Selecciona un paciente");
            if (!treatment.trim()) return toast.error("Indica el tratamiento");
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Paciente</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder={patients.length ? "Selecciona paciente" : "Crea primero un paciente"} />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duración (min)</Label>
            <Input type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Tratamiento</Label>
            <Input value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Limpieza, ortodoncia, endodoncia..." required />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}