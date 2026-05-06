import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { NAV } from "./nav";
import { GraduationCap, LogOut, Menu, X, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const items = NAV[user.role];

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">CollegeOS</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{user.role}</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                )
              }
            >
              <it.icon className="size-4" />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="size-4" /> Logout
          </Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur lg:px-6">
          <button onClick={() => setOpen(true)} className="lg:hidden">
            <Menu className="size-5" />
          </button>
          <div className="hidden flex-1 items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5 md:flex md:max-w-md">
            <Search className="size-4 text-muted-foreground" />
            <input
              placeholder="Search..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            <button className="relative rounded-lg p-2 hover:bg-muted">
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
            </button>
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-xs text-primary-foreground">
                  {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-right md:block">
                <div className="text-xs font-semibold">{user.name}</div>
                <div className="text-[10px] text-muted-foreground">{user.email}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
