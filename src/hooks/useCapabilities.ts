import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyCompanies } from "@/hooks/useServices";
import { buildCapabilities, type Capabilities } from "@/lib/capabilities";

export function useCapabilities(): Capabilities {
  const { user, profile } = useAuth();
  const { data: myCompanies } = useMyCompanies(profile?.id);

  const myCompanyIds = useMemo(
    () => myCompanies?.map((c) => c.id) ?? [],
    [myCompanies],
  );

  return useMemo(
    () =>
      buildCapabilities({
        user,
        profile: profile ?? null,
        myCompanyIds,
      }),
    [user, profile, myCompanyIds],
  );
}
