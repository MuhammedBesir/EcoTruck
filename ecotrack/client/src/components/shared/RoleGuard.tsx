import { Navigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import type { AppUser } from "../../types";

interface RoleGuardProps {
  allowedRoles: AppUser["role"][];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { currentUser } = useAppContext();

  if (!currentUser) return null;

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
