import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const Index = () => {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />;
};

export default Index;
