import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isProfileComplete } from "@/lib/profile";
import { isAllowedWithIncompleteProfile } from "@/lib/routes";
import { Loader2 } from "lucide-react";

/**
 * После входа без заполненного профиля — только публичные страницы и /complete-profile.
 * Заполненный профиль не должен застревать на /complete-profile.
 */
export default function RequireCompleteProfile({ children }: { children: ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && profile && !isProfileComplete(profile) && !isAllowedWithIncompleteProfile(pathname)) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (user && profile && isProfileComplete(profile) && pathname === "/complete-profile") {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
