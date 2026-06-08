import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicProfile(profileId: string | undefined) {
  return useQuery({
    queryKey: ["public-profile", profileId],
    queryFn: async () => {
      if (!profileId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, city, role, created_at")
        .eq("id", profileId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });
}

export function useProfileCompanies(ownerProfileId: string | undefined) {
  return useQuery({
    queryKey: ["profile-companies", ownerProfileId],
    queryFn: async () => {
      if (!ownerProfileId) return [];

      const { data, error } = await supabase
        .from("companies")
        .select("id, name, logo_url, city, category, verification_status")
        .eq("owner_id", ownerProfileId)
        .order("name");

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ownerProfileId,
  });
}
