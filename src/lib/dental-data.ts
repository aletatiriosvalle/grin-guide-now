import { supabase } from "@/integrations/supabase/client";

export type Patient = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  patient_id: string;
  starts_at: string;
  duration_min: number;
  treatment: string;
  status: "scheduled" | "done" | "cancelled" | string;
  notes: string | null;
  manage_token?: string;
  reminder_sent_at?: string | null;
  cancelled_at?: string | null;
  reschedule_requested?: boolean;
  patient?: Patient | null;
};

export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("full_name");
  if (error) throw error;
  return data as Patient[];
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, patient:patients(*)")
    .order("starts_at");
  if (error) throw error;
  return data as Appointment[];
}

export async function createPatient(input: Omit<Patient, "id" | "user_id" | "created_at">) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("No session");
  const { error } = await supabase.from("patients").insert({ ...input, user_id: u.user.id });
  if (error) throw error;
}

export async function createAppointment(input: {
  patient_id: string;
  starts_at: string;
  duration_min: number;
  treatment: string;
  notes?: string | null;
}) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("No session");
  const { error } = await supabase.from("appointments").insert({ ...input, user_id: u.user.id });
  if (error) throw error;
}

export async function updateAppointmentStatus(id: string, status: string) {
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
}

export async function deletePatient(id: string) {
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) throw error;
}