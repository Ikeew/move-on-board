import { Navigate, Outlet } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export function PrivateRoute() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        <div className="size-10 rounded-full border-4 border-[#4f46e5] border-t-transparent animate-spin" />
      </div>
    );
  }

  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
