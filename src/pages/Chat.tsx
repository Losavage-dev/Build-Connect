import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Building2, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { markNotificationsReadForRequest } from "@/hooks/useNotifications";
import {
  companyNameFromMeta,
  META_LINE_COMPANY,
  META_LINE_LINK,
  META_LINE_PROMO,
  META_LINE_SOURCE,
  parseOpeningMessageBody,
  splitRequestOpeningMessage,
} from "@/lib/requestChatMessage";
import { getRequestDisplay } from "@/lib/requestDisplay";
import type { Request } from "@/hooks/useRequests";
import { useUpdateRequestStatus } from "@/hooks/useRequests";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function linkActionLabel(url: string): string {
  try {
    const u = new URL(url);
    const hasPost = u.searchParams.get("post");
    const hasListing = u.searchParams.get("listing");
    if (u.pathname.includes("/feed") && hasPost) return "Открыть этот ролик на витрине";
    if (u.pathname.includes("/feed")) return "Открыть витрину роликов";
    if (u.pathname.includes("/materials") && hasListing) return "Открыть этот материал в списке";
    if (u.pathname.includes("/materials")) return "Витрина материалов";
    if (u.pathname.includes("/services") && hasListing) return "Открыть эту услугу в списке";
    if (u.pathname.includes("/services")) return "Витрина услуг";
    if (u.pathname.includes("/company/")) return "Открыть карточку компании";
    if (u.pathname.includes("/tenders") && hasListing) return "Открыть этот тендер в списке";
    if (u.pathname.includes("/tenders")) return "Раздел тендеров";
  } catch {
    /* invalid URL */
  }
  return "Открыть ссылку";
}

function internalAppPath(url: string): string | null {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (typeof window !== "undefined" && u.origin !== window.location.origin) return null;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return null;
  }
}

function ChatMetaLine({ line, isMe }: { line: string; isMe: boolean }) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(META_LINE_COMPANY)) return null;

  const linkPrefixes = [META_LINE_LINK, META_LINE_PROMO] as const;
  for (const prefix of linkPrefixes) {
    if (trimmed.startsWith(prefix)) {
      const url = trimmed.slice(prefix.length).trim();
      const shortLabel = linkActionLabel(url);
      const internalTo = internalAppPath(url);
      const linkClass = `inline-flex max-w-full text-sm font-medium underline underline-offset-2 break-all ${
        isMe ? "text-primary-foreground" : "text-primary"
      }`;
      return internalTo ? (
        <Link to={internalTo} className={linkClass} title={url}>
          {shortLabel}
        </Link>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className={linkClass} title={url}>
          {shortLabel}
        </a>
      );
    }
  }

  if (trimmed.startsWith(META_LINE_SOURCE)) {
    const rest = trimmed.slice(META_LINE_SOURCE.length).trim();
    return (
      <p className={`text-xs leading-snug ${isMe ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{rest}</p>
    );
  }

  return (
    <p className={`text-xs break-words ${isMe ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{trimmed}</p>
  );
}

function formatCompanyLine(name: string): string {
  const trimmed = name.trim();
  if (trimmed.startsWith("\u00ab") && trimmed.endsWith("\u00bb")) return `\u041e\u0442 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438 ${trimmed}`;
  return `\u041e\u0442 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438 \u00ab${trimmed}\u00bb`;
}

function ChatMessageBody({ content, isMe }: { content: string; isMe: boolean }) {
  const { body, meta } = splitRequestOpeningMessage(content);
  const parsed = parseOpeningMessageBody(body);
  const companyName = parsed.companyName || companyNameFromMeta(meta);
  const userText = parsed.userText;
  const metaLines = meta
    ? meta.split("\n").filter((line) => !line.trim().startsWith(META_LINE_COMPANY))
    : [];
  const hasContext = Boolean(companyName || metaLines.some((line) => line.trim()));

  if (!hasContext) {
    return <p className="break-words whitespace-pre-wrap leading-relaxed">{userText || content}</p>;
  }

  const muted = isMe ? "text-primary-foreground/80" : "text-muted-foreground";
  const ctxClass = isMe
    ? "mt-2 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-2.5 py-2 space-y-1.5"
    : "mt-2 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-2 space-y-1.5";

  return (
    <div>
      {userText ? <p className="break-words whitespace-pre-wrap leading-relaxed">{userText}</p> : null}
      <div className={ctxClass}>
        {companyName ? <p className={`text-xs ${muted}`}>{formatCompanyLine(companyName)}</p> : null}
        {metaLines.map((line, i) => (
          <ChatMetaLine key={i} line={line} isMe={isMe} />
        ))}
      </div>
    </div>
  );
}

const Chat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useMessages(requestId);
  const sendMessage = useSendMessage();
  const updateRequest = useUpdateRequestStatus();

  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: requestInfo } = useQuery({
    queryKey: ["request-info", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          company:companies (name, logo_url),
          client:profiles!requests_client_id_fkey (first_name, last_name, avatar_url),
          recipient:profiles!requests_recipient_profile_id_fkey (first_name, last_name, avatar_url)
        `)
        .eq("id", requestId)
        .single();
      if (error) throw error;
      return data as Request;
    },
    enabled: !!requestId,
  });

  if (!user) {
    navigate("/auth");
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!requestId || !profile?.id) return;
    void markNotificationsReadForRequest(requestId, profile.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ["inbox-counts"] });
    });
  }, [requestId, profile?.id, queryClient]);

  useEffect(() => {
    if (requestId && profile?.id) {
      supabase
        .from("messages")
        .update({ is_read: true })
        .eq("request_id", requestId)
        .neq("sender_id", profile.id)
        .eq("is_read", false)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["inbox-counts"] });
          queryClient.invalidateQueries({ queryKey: ["user-unread-messages"] });
          queryClient.invalidateQueries({ queryKey: ["request-chat-summaries"] });
        });
    }
  }, [requestId, profile?.id, messages, queryClient]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !requestId || chatClosed) return;

    try {
      await sendMessage.mutateAsync({
        request_id: requestId,
        content: content.trim(),
      });
      setContent("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const chatDisplay = requestInfo && profile?.id ? getRequestDisplay(requestInfo, profile.id) : null;

  const requestStatusLabel: Record<string, string> = {
    pending: "На рассмотрении",
    accepted: "Принята",
    rejected: "Отклонена",
    completed: "Завершена",
  };

  const canCompleteRequest =
    requestInfo &&
    requestInfo.status !== "completed" &&
    requestInfo.status !== "rejected";

  const canLeaveReview =
    requestInfo?.status === "completed" &&
    requestInfo.company_id &&
    profile?.id === requestInfo.client_id;

  const chatClosed =
    requestInfo?.status === "completed" || requestInfo?.status === "rejected";

  const handleCompleteRequest = async () => {
    if (!requestId) return;
    try {
      await updateRequest.mutateAsync({ id: requestId, status: "completed" });
      const linkedTender = requestInfo?.source_tender_id;
      toast.success(
        linkedTender
          ? "Заявка завершена, тендер закрыт. Можно оставить отзыв о компании."
          : "Заявка завершена — теперь можно оставить отзыв о компании",
      );
    } catch {
      toast.error("Не удалось завершить заявку");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 container max-w-4xl mx-auto p-4 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        <div className="bg-card border rounded-t-xl p-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 border shrink-0">
                <AvatarImage src={chatDisplay?.avatarUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {chatDisplay?.avatarFallback || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight break-words">
                  {chatDisplay?.title || "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026"}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 break-words">
                  {requestInfo?.title || ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        {requestInfo ? (
          <div className="border-x bg-muted/30 px-4 py-2.5 flex flex-wrap items-center gap-2 text-sm shrink-0">
            <Badge variant="outline" className="rounded-lg font-normal">
              {requestStatusLabel[requestInfo.status] || requestInfo.status}
            </Badge>
            {canCompleteRequest ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-lg h-8"
                disabled={updateRequest.isPending}
                onClick={() => void handleCompleteRequest()}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Завершить заявку
              </Button>
            ) : null}
            {canLeaveReview ? (
              <Button type="button" variant="outline" size="sm" className="rounded-lg h-8" asChild>
                <Link to={`/company/${requestInfo.company_id}#reviews`}>
                  <Star className="h-3.5 w-3.5 mr-1" />
                  Оставить отзыв
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto bg-muted/20 border-x p-4 space-y-4">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              {"\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0439\u2026"}
            </div>
          )}

          {!isLoading && messages?.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <Building2 className="h-12 w-12 mb-3" />
              <p>{"\u041e\u0442\u043f\u0440\u0430\u0432\u044c\u0442\u0435 \u043f\u0435\u0440\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435"}</p>
            </div>
          )}

          {messages?.map((msg) => {
            const isMe = msg.sender_id === profile?.id;
            const initials = msg.sender?.first_name?.charAt(0) || "U";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <Avatar className="h-8 w-8 mt-1 shrink-0">
                  <AvatarImage src={msg.sender?.avatar_url || ""} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>

                <div className={`flex flex-col min-w-0 ${isMe ? "items-end" : "items-start"}`}>
                  <div className="text-xs text-muted-foreground mb-1 px-1">
                    {msg.sender?.first_name || (isMe ? "\u0412\u044b" : "\u0421\u043e\u0431\u0435\u0441\u0435\u0434\u043d\u0438\u043a")}
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl max-w-full ${
                      isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border rounded-tl-sm"
                    }`}
                  >
                    <ChatMessageBody content={msg.content} isMe={isMe} />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
                    {formatMessageTime(msg.created_at)}
                    {isMe ? (
                      <span className="text-primary/70 font-semibold ml-1">{msg.is_read ? "\u2713\u2713" : "\u2713"}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-card border rounded-b-xl p-4 shrink-0">
          {chatClosed ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              {requestInfo?.status === "rejected"
                ? "Заявка отклонена — переписка закрыта."
                : "Заявка завершена — новые сообщения отправить нельзя. История чата сохранена."}
            </p>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2 items-end">
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={"\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435\u2026"}
                className="flex-1 rounded-xl bg-muted/50 border-transparent focus-visible:border-primary/30"
                autoComplete="off"
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-xl shrink-0 h-10 w-10"
                disabled={!content.trim() || sendMessage.isPending}
              >
                <Send className="h-5 w-5 ml-0.5" />
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default Chat;
