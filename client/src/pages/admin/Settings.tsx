import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Name</Label><Input defaultValue={user?.name} /></div>
          <div className="space-y-2"><Label>Email</Label><Input defaultValue={user?.email} /></div>
          <div className="space-y-2"><Label>Institution</Label><Input defaultValue="State Engineering College" /></div>
          <div className="space-y-2"><Label>Timezone</Label><Input defaultValue="UTC+05:30" /></div>
        </CardContent>
      </Card>
      <Button onClick={() => toast.success("Settings saved")}>Save Changes</Button>
    </div>
  );
}
