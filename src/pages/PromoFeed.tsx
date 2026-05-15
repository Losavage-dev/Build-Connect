import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authPath } from "@/lib/authRedirect";
import {
  Heart,
  MessageCircle,
  Sparkles,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Send,
  Clapperboard,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { usePromoFeed, useTogglePromoLike, useAddPromoComment, type PromoPostEnriched } from "@/hooks/usePromoFeed";
import { useCreateRequest } from "@/hooks/useRequests";
import { buildRequestSource } from "@/lib/requestSource";
import { openRequestChat } from "@/lib/openRequestChat";
import { useMyCompanies } from "@/hooks/useServices";
import { useCapabilities } from "@/hooks/useCapabilities";
import { StaffBrowsingBanner } from "@/components/StaffBrowsingBanner";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BUSINESS_CATEGORIES, KAZAKHSTAN_CITIES } from "@/lib/constants";

const defaultQuoteText =
  "Прошу рассчитать потенциальный объём заказа и условия по этому предложению.";

function PromoPostCard({
  post,
  user,
  profile,
  expanded,
  onToggleExpand,
  commentDraft,
  onCommentDraft,
  quoteChecked,
  onQuoteChecked,
  onSubmitComment,
  commentPending,
  onLike,
  likePending,
  onOpenContact,
}: {
  post: PromoPostEnriched;
  user: ReturnType<typeof useAuth>["user"];
  profile: ReturnType<typeof useAuth>["profile"];
  expanded: boolean;
  onToggleExpand: () => void;
  commentDraft: string;
  onCommentDraft: (v: string) => void;
  quoteChecked: boolean;
  onQuoteChecked: (v: boolean) => void;
  onSubmitComment: () => void;
  commentPending: boolean;
  onLike: () => void;
  likePending: boolean;
  onOpenContact: () => void;
}) {
  const c = post.company;
  const initials = (c.name || "?").slice(0, 2).toUpperCase();

  return (
    <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5 bg-card/95 backdrop-blur-sm ring-1 ring-border/60">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black">
          <iframe
            title={post.title || c.name}
            src={youtubeEmbedUrl(post.youtube_video_id)}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-11 w-11 rounded-xl border">
              <AvatarImage src={c.logo_url || undefined} alt={c.name} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <Link
                to={`/company/${c.id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {c.name}
              </Link>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {c.city}
                </span>
                <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                  {c.category}
                </Badge>
              </div>
            </div>
          </div>

          {post.title ? <h3 className="font-bold text-lg leading-snug">{post.title}</h3> : null}
          {post.caption ? <p className="text-sm text-muted-foreground leading-relaxed">{post.caption}</p> : null}
          {post.videoCategories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {post.videoCategories.map((cat) => (
                <Badge key={cat} variant="outline" className="text-[10px] font-normal px-2 py-0.5 rounded-lg">
                  {cat}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={post.likedByMe ? "default" : "outline"}
              size="sm"
              className={cn("rounded-full gap-2", post.likedByMe && "shadow-md")}
              disabled={!user || likePending}
              onClick={() => {
                if (!user) return;
                onLike();
              }}
            >
              <Heart className={cn("h-4 w-4", post.likedByMe && "fill-current")} />
              {post.likeCount}
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-full gap-2" onClick={onToggleExpand}>
              <MessageCircle className="h-4 w-4" />
              {post.comments.length}
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
            <Button type="button" variant="secondary" size="sm" className="rounded-full ml-auto" onClick={onOpenContact}>
              Связаться
            </Button>
          </div>

          {!user ? (
            <p className="text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary font-medium underline-offset-2 hover:underline">
                Войдите
              </Link>
              , чтобы ставить лайки и писать комментарии — данные пригодятся для персональных рекомендаций.
            </p>
          ) : null}

          {expanded && (
            <div className="space-y-4 pt-2 border-t border-border/60">
              <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
                {post.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Пока нет комментариев — будьте первым.</p>
                ) : (
                  post.comments.map((cm) => (
                    <div key={cm.id} className="rounded-xl bg-muted/40 px-3 py-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          {cm.author?.first_name || "Участник"}{" "}
                          {cm.author?.last_name ? `${cm.author.last_name[0]}.` : ""}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {format(new Date(cm.created_at), "d MMM HH:mm", { locale: ru })}
                        </span>
                      </div>
                      {cm.is_quote_request ? (
                        <Badge variant="outline" className="text-[10px] mb-1 border-primary/40 text-primary">
                          Запрос расчёта объёма
                        </Badge>
                      ) : null}
                      <p className="text-muted-foreground whitespace-pre-wrap">{cm.content}</p>
                    </div>
                  ))
                )}
              </div>

              {user && profile ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Комментарии публичны на витрине. Для личного диалога с компанией нажмите «Связаться».
                  </p>
                  <Textarea
                    placeholder="Комментарий или уточняющий вопрос…"
                    value={commentDraft}
                    onChange={(e) => onCommentDraft(e.target.value)}
                    rows={3}
                    className="resize-none rounded-xl bg-muted/30"
                    maxLength={2000}
                  />
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`quote-${post.id}`}
                      checked={quoteChecked}
                      onCheckedChange={(v) => onQuoteChecked(v === true)}
                    />
                    <Label htmlFor={`quote-${post.id}`} className="text-sm font-normal leading-snug cursor-pointer">
                      Отметить как запрос расчёта потенциального объёма заказа (поставщик увидит это в комментарии)
                    </Label>
                  </div>
                  <Button
                    type="button"
                    className="w-full rounded-xl gap-2"
                    disabled={commentPending}
                    onClick={onSubmitComment}
                  >
                    {commentPending ? (
                      "Отправка…"
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Отправить
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const PromoFeed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const highlightPostId = searchParams.get("post");
  const postAnchors = useRef<Record<string, HTMLDivElement | null>>({});

  const { user, profile } = useAuth();
  const caps = useCapabilities();
  const { data: myCompanies } = useMyCompanies(profile?.id);
  const hasCompanies = (myCompanies?.length ?? 0) > 0;
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const feedFilters = useMemo(
    () => ({
      city: filterCity,
      category: filterCategory,
    }),
    [filterCity, filterCategory],
  );
  const { data: posts, isLoading, isError, error, refetch } = usePromoFeed(feedFilters);
  const toggleLike = useTogglePromoLike();
  const addComment = useAddPromoComment();
  const createRequest = useCreateRequest();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [quoteByPost, setQuoteByPost] = useState<Record<string, boolean>>({});

  const [contactOpen, setContactOpen] = useState(false);
  const [contactCompanyId, setContactCompanyId] = useState("");
  const [contactCompanyName, setContactCompanyName] = useState("");
  const [contactPostId, setContactPostId] = useState("");
  const [contactPostTitle, setContactPostTitle] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");

  useEffect(() => {
    if (!highlightPostId || !posts?.length) return;
    const el = postAnchors.current[highlightPostId];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightPostId, posts]);

  const openContact = (companyId: string, companyName: string, postId: string, postTitle: string) => {
    if (!user) {
      toast.error("Войдите, чтобы отправить заявку");
      navigate(authPath(`${location.pathname}${location.search}`));
      return;
    }
    setContactCompanyId(companyId);
    setContactCompanyName(companyName);
    setContactPostId(postId);
    setContactPostTitle(postTitle.trim());
    setRequestTitle(postTitle.trim() ? `Запрос по ролику: ${postTitle.trim()}` : `Запрос по ролику: ${companyName}`);
    setRequestDescription("");
    setContactOpen(true);
  };

  const submitRequest = async () => {
    if (!requestTitle.trim()) {
      toast.error("Укажите тему заявки");
      return;
    }
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const feedUrl = contactPostId
        ? `${origin}/feed?post=${encodeURIComponent(contactPostId)}`
        : `${origin}/feed`;
      const req = await createRequest.mutateAsync({
        company_id: contactCompanyId,
        title: requestTitle.trim(),
        description: requestDescription.trim() || undefined,
        initial_message: requestDescription.trim() || undefined,
        promo_post_id: contactPostId || undefined,
        source: buildRequestSource({
          kind: "promo",
          detail: contactPostTitle.trim()
            ? `ролик «${contactPostTitle.trim()}»`
            : `витрина — ${contactCompanyName}`,
          url: feedUrl,
        }),
      });
      toast.success("Заявка отправлена — откройте чат для переписки.");
      openRequestChat(navigate, req.id);
      setContactOpen(false);
      setContactPostId("");
      setContactPostTitle("");
    } catch {
      toast.error("Не удалось отправить заявку");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section
        className="relative overflow-hidden border-b border-border/40"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.25),transparent)] pointer-events-none" />
        <div className="container relative px-4 py-12 md:py-16 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-1.5 text-sm font-medium shadow-sm ring-1 ring-border/60">
            <Clapperboard className="h-4 w-4 text-primary" />
            Витрина роликов
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-balance">
            Выбирайте партнёра по{" "}
            <span className="gradient-text">живой презентации</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Ролики хостятся на YouTube — вы добавляете ссылку у нас, а зрители смотрят и реагируют прямо в ленте. Лайки и
            комментарии заложены под будущие рекомендации по вовлечённости.
          </p>
          {!caps.isStaff && hasCompanies ? (
            <p className="text-sm text-muted-foreground">
              Управляйте роликами в{" "}
              <Link to="/profile" className="text-primary font-semibold underline-offset-2 hover:underline">
                профиле
              </Link>{" "}
              → «Мои компании» → управление → вкладка «Видео».
            </p>
          ) : user && !caps.isStaff ? (
            <p className="text-sm text-muted-foreground">
              Чтобы публиковать ролики,{" "}
              <Link to="/create-company" className="text-primary font-semibold underline-offset-2 hover:underline">
                создайте компанию
              </Link>
              .
            </p>
          ) : null}
        </div>
      </section>

      <div className="container px-4 py-10 max-w-lg mx-auto space-y-8 pb-20">
        <StaffBrowsingBanner />
        <div className="rounded-2xl border bg-card/80 p-4 space-y-3 shadow-sm">
          <p className="text-sm font-medium text-foreground">Фильтры ленты</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Город компании</Label>
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Город" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">Все города</SelectItem>
                  {KAZAKHSTAN_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Тема ролика</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">Все категории</SelectItem>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Свежие публикации</span>
        </div>

        {isError ? (
          <QueryErrorBlock error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-[420px] w-full rounded-2xl" />
            ))}
          </div>
        ) : !posts?.length ? (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="py-14 text-center space-y-4">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <div>
                <p className="font-semibold text-lg">
                  {filterCity !== "all" || filterCategory !== "all"
                    ? "Нет роликов с такими фильтрами"
                    : "Пока нет роликов в ленте"}
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {filterCity !== "all" || filterCategory !== "all" ? (
                    <>
                      Сбросьте фильтры или выберите другой город или тему — публикации идут по времени добавления.
                    </>
                  ) : (
                    <>
                      Владельцы компаний могут добавить ссылку на YouTube в управлении компанией — запись появится
                      здесь.
                    </>
                  )}
                </p>
              </div>
              {!caps.isStaff && hasCompanies ? (
                <Button asChild variant="default" className="rounded-xl">
                  <Link to="/profile">Мои компании</Link>
                </Button>
              ) : user && !caps.isStaff ? (
                <Button asChild variant="default" className="rounded-xl">
                  <Link to="/create-company">Создать компанию</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to={authPath("/feed")}>Войти</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              ref={(el) => {
                postAnchors.current[post.id] = el;
              }}
              className={cn(
                "rounded-2xl transition-shadow",
                highlightPostId === post.id && "ring-2 ring-primary shadow-lg shadow-primary/20",
              )}
            >
            <PromoPostCard
              post={post}
              user={user}
              profile={profile}
              expanded={expandedIds.has(post.id)}
              onToggleExpand={() => toggleExpand(post.id)}
              commentDraft={drafts[post.id] ?? ""}
              onCommentDraft={(v) => setDrafts((d) => ({ ...d, [post.id]: v }))}
              quoteChecked={quoteByPost[post.id] ?? false}
              onQuoteChecked={(v) => setQuoteByPost((q) => ({ ...q, [post.id]: v }))}
              onSubmitComment={async () => {
                const raw = (drafts[post.id] ?? "").trim();
                const quote = quoteByPost[post.id] ?? false;
                const content = raw || (quote ? defaultQuoteText : "");
                if (!content) {
                  toast.error("Введите текст или отметьте запрос расчёта");
                  return;
                }
                try {
                  await addComment.mutateAsync({
                    postId: post.id,
                    content,
                    isQuoteRequest: quote,
                  });
                  setDrafts((d) => ({ ...d, [post.id]: "" }));
                  setQuoteByPost((q) => ({ ...q, [post.id]: false }));
                  toast.success("Комментарий опубликован");
                } catch {
                  toast.error("Не удалось отправить");
                }
              }}
              commentPending={addComment.isPending && addComment.variables?.postId === post.id}
              onLike={async () => {
                try {
                  await toggleLike.mutateAsync({
                    postId: post.id,
                    currentlyLiked: post.likedByMe,
                    videoCategories: post.videoCategories,
                  });
                } catch {
                  toast.error("Не удалось обновить лайк");
                }
              }}
              likePending={toggleLike.isPending && toggleLike.variables?.postId === post.id}
              onOpenContact={() =>
                openContact(post.company_id, post.company.name, post.id, post.title || "")
              }
            />
            </div>
          ))
        )}
      </div>

      <Dialog
        open={contactOpen}
        onOpenChange={(open) => {
          setContactOpen(open);
          if (!open) {
            setContactPostId("");
            setContactPostTitle("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Заявка компании</DialogTitle>
            <DialogDescription>
              {contactCompanyName ? `Сообщение уйдёт в чат с «${contactCompanyName}».` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Тема</Label>
              <Input value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Детали (необязательно)</Label>
              <Textarea
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                rows={4}
                className="rounded-xl resize-none"
                placeholder="Объём, сроки, адрес объекта…"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setContactOpen(false)}>
              Отмена
            </Button>
            <Button className="rounded-xl" onClick={submitRequest} disabled={createRequest.isPending}>
              {createRequest.isPending ? "Отправка…" : "Отправить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoFeed;
