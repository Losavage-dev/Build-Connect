import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CHAT_REQUEST_CONTEXT_MARKER, META_LINE_COMPANY, META_LINE_LINK, META_LINE_SOURCE } from "@/lib/requestChatMessage";
import { isMissingColumnError } from "@/lib/formatSupabaseError";
import { trackUserEvent } from "@/lib/recommendations";

export interface Request {
  id: string;
  company_id: string | null;
  recipient_profile_id: string | null;
  source_tender_id?: string | null;
  client_id: string;
  title: string;
  description: string | null;
  status: "pending" | "accepted" | "rejected" | "completed";
  created_at: string;
  updated_at: string;
  company?: {
    name: string;
    logo_url: string | null;
  } | null;
  recipient?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  client?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export type RequestSourceContext = {
  kind: "promo" | "tender" | "service" | "material" | "catalog";
  label: string;
  url?: string;
};

export type CreateRequestInput = {
  /** Компания-получатель (если у автора тендера есть компания) */
  company_id?: string;
  /** Профиль-получатель (если компании нет — отклик на тендер) */
  recipient_profile_id?: string;
  title: string;
  description?: string;
  /** Текст, который сразу попадёт в чат (видит владелец при открытии диалога) */
  initial_message?: string;
  /** Ссылка на ролик витрины в первом сообщении */
  promo_post_id?: string;
  /** Контекст: тендер, услуга, каталог и т.д. */
  source?: RequestSourceContext;
  /** От имени какой компании отправлен отклик (в служебный блок чата, не в текст сообщения) */
  acting_company_name?: string;
  /** Тендер, если заявка — отклик */
  source_tender_id?: string;
};

export function useRequests() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["requests", profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data: myCompanies } = await supabase.from("companies").select("id").eq("owner_id", profile.id);

      const myCompanyIds = myCompanies?.map((c) => c.id) || [];

      let query = supabase.from("requests").select(`
          *,
          company:companies (name, logo_url),
          client:profiles!requests_client_id_fkey (first_name, last_name, avatar_url),
          recipient:profiles!requests_recipient_profile_id_fkey (first_name, last_name, avatar_url)
        `);

      const parts = [`client_id.eq.${profile.id}`, `recipient_profile_id.eq.${profile.id}`];
      if (myCompanyIds.length > 0) {
        parts.push(`company_id.in.(${myCompanyIds.join(",")})`);
      }
      query = query.or(parts.join(","));

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data as Request[];
    },
    enabled: !!profile,
  });
}

function buildFirstChatMessage(input: CreateRequestInput): string {
  const title = input.title.trim();
  const main = (input.initial_message ?? "").trim() || (input.description ?? "").trim();

  const metaLines: string[] = [];
  if (input.acting_company_name?.trim()) {
    metaLines.push(`${META_LINE_COMPANY} «${input.acting_company_name.trim()}»`);
  }
  if (input.source?.label) {
    metaLines.push(`${META_LINE_SOURCE} ${input.source.label}`);
    if (input.source.url?.trim()) {
      metaLines.push(`${META_LINE_LINK} ${input.source.url.trim()}`);
    }
  }
  if (input.promo_post_id) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const promoUrl = `${origin}/feed?post=${encodeURIComponent(input.promo_post_id)}`;
    const srcUrl = input.source?.url?.trim() || "";
    const alreadyLinked =
      srcUrl.includes("/feed") &&
      (srcUrl.includes(`post=${input.promo_post_id}`) || srcUrl.includes(encodeURIComponent(input.promo_post_id)));
    if (!alreadyLinked) {
      metaLines.push(`Ролик на витрине: ${promoUrl}`);
    }
  }

  const metaBlock = metaLines.join("\n");

  if (!main && !metaBlock) {
    return title ? `Заявка: ${title}` : "Новая заявка";
  }

  if (!metaBlock) {
    return main || (title ? `Заявка: ${title}` : "Новая заявка");
  }

  if (!main) {
    return metaBlock;
  }

  return `${main}${CHAT_REQUEST_CONTEXT_MARKER}${metaBlock}`;
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (request: CreateRequestInput) => {
      if (!profile) throw new Error("User not authenticated");

      const {
        initial_message: _i,
        promo_post_id: _p,
        source: _s,
        acting_company_name: _a,
        source_tender_id,
        company_id,
        recipient_profile_id,
        ...row
      } = request;

      if (!company_id && !recipient_profile_id) {
        throw new Error("Укажите получателя заявки (компания или профиль)");
      }
      if (company_id && recipient_profile_id) {
        throw new Error("Нельзя указать одновременно компанию и профиль получателя");
      }
      if (recipient_profile_id === profile.id) {
        throw new Error("Нельзя отправить заявку самому себе");
      }

      const baseRow = {
        company_id: company_id ?? null,
        recipient_profile_id: recipient_profile_id ?? null,
        title: row.title,
        description: row.description ?? null,
        client_id: profile.id,
      };

      let reqResult = await supabase
        .from("requests")
        .insert({ ...baseRow, source_tender_id: source_tender_id ?? null })
        .select()
        .single();

      if (reqResult.error && source_tender_id && isMissingColumnError(reqResult.error, "source_tender_id")) {
        reqResult = await supabase.from("requests").insert(baseRow).select().single();
      }

      const { data: req, error } = reqResult;
      if (error) throw error;

      const content = buildFirstChatMessage(request);
      const { error: msgErr } = await supabase.from("messages").insert({
        request_id: req.id,
        sender_id: profile.id,
        content,
      });
      if (msgErr) throw msgErr;

      if (company_id) {
        trackUserEvent(profile.id, "contact_company", "company", company_id, {
          source: request.source?.kind,
        });
      }
      if (source_tender_id) {
        trackUserEvent(profile.id, "bid_tender", "tender", source_tender_id);
      }

      return req;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-events"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-counts"] });
      queryClient.invalidateQueries({ queryKey: ["request-chat-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["tender-responses"] });
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Request["status"] }) => {
      const { data, error } = await supabase
        .from("requests")
        .update({ status })
        .eq("id", id)
        .select("*, source_tender_id")
        .single();

      if (error) throw error;

      if (status === "completed" && data.source_tender_id) {
        const { error: tenderErr } = await supabase
          .from("tenders")
          .update({ status: "closed", updated_at: new Date().toISOString() })
          .eq("id", data.source_tender_id);
        if (tenderErr) throw tenderErr;
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-counts"] });
      queryClient.invalidateQueries({ queryKey: ["request-chat-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["request-info", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["tender-responses"] });
      queryClient.invalidateQueries({ queryKey: ["review-eligibility"] });
      if (variables.status === "completed") {
        queryClient.invalidateQueries({ queryKey: ["tenders"] });
        queryClient.invalidateQueries({ queryKey: ["my-tenders"] });
      }
    },
  });
}
export function useDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("requests").delete().eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) {
        throw new Error(
          "Заявка не удалена: нет прав или строка не найдена. Если вы владелец компании — примените миграцию БД «participant delete» для таблицы requests.",
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-counts"] });
      queryClient.invalidateQueries({ queryKey: ["request-chat-summaries"] });
    },
  });
}
