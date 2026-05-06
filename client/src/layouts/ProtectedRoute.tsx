import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types";
import { AppLayout } from "./AppLayout";
import { ReactNode } from "react";

export function ProtectedRoute({ roles, children }: { roles?: Role[] | string[]; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  
  // Handle role-based access
  if (roles && roles.length > 0) {
    const hasAccess = roles.includes(user.role);
    if (!hasAccess) {
      // Redirect to appropriate dashboard based on role
      const rolePath = user.role === "SUPER_ADMIN" ? "super-admin" : user.role.toLowerCase();
      return <Navigate to={`/${rolePath}/dashboard`} replace />;
    }
  }
  
  return <AppLayout>{children}</AppLayout>;
}
