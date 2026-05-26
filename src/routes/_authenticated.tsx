import { createFileRoute, redirect, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Users, LogOut, Sparkles, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const initials =
    (user?.user_metadata?.full_name as string | undefined)
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "DR";

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 flex-col p-6 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 text-lg font-display font-semibold">
          <Sparkles className="size-5 text-sidebar-primary" /> Sonrisa
        </div>

        <nav className="mt-10 space-y-1 text-sm">
          <NavItem to="/app" icon={<LayoutDashboard className="size-4" />}>Panel</NavItem>
          <NavItem to="/app/calendar" icon={<CalendarDays className="size-4" />}>Calendario</NavItem>
          <NavItem to="/app/patients" icon={<Users className="size-4" />}>Pacientes</NavItem>
        </nav>

        <div className="mt-auto pt-6 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-9 rounded-full bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-semibold text-sm">
              {initials}
            </div>
            <div className="text-xs">
              <div className="font-medium truncate max-w-[140px]">
                {(user?.user_metadata?.full_name as string) ?? "Doctora"}
              </div>
              <div className="text-sidebar-foreground/60 truncate max-w-[140px]">{user?.email}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="size-4 mr-2" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/app" }}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
      activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground" }}
    >
      {icon} {children}
    </Link>
  );
}