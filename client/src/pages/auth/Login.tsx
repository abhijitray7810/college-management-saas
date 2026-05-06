import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("admin@college.edu");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome, ${u.name}`);
      navigate(`/${u.role.toLowerCase()}/dashboard`);
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const quick = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-primary via-primary-glow to-[hsl(262_83%_65%)] p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <GraduationCap className="size-5" />
          </div>
          <span className="font-semibold">CollegeOS</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">The operating system for modern colleges.</h1>
          <p className="mt-4 max-w-md text-white/80">
            Routine generation, attendance tracking, availability and analytics — all in one elegant workspace.
          </p>
        </div>
        <div className="text-xs text-white/60">© 2026 CollegeOS. All rights reserved.</div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back. Enter your credentials below.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Sign in
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">Create one</Link>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs">
            <div className="mb-2 font-semibold text-foreground">Demo accounts</div>
            <div className="space-y-1">
              {[
                { r: "Admin", e: "admin@college.edu", p: "admin123" },
                { r: "Teacher", e: "teacher@college.edu", p: "teacher123" },
                { r: "Student", e: "student@college.edu", p: "student123" },
              ].map((d) => (
                <button type="button" key={d.r} onClick={() => quick(d.e, d.p)} className="flex w-full justify-between rounded px-2 py-1 hover:bg-background">
                  <span className="font-medium">{d.r}</span>
                  <span className="text-muted-foreground">{d.e}</span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
