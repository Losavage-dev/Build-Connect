import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
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
  Shield,
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
import { ModeratorPromoContactDialog } from "@/components/moderator/ModeratorPromoContactDialog";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { format } from "date-fns";
import { useDateFnsLocale } from "@/hooks/useAppFormat";
import { useCatalogLabel } from "@/lib/i18nCatalog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BUSINESS_CATEGORIES, KAZAKHSTAN_CITIES } from "@/lib/constants";
import { PageHero, PageContent } from "@/components/layout/PageHero";

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
  canRegularContact,
  showStaffPromoActions,
  onOpenStaffContact,
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
  canRegularContact: boolean;
  showStaffPromoActions: boolean;
  onOpenStaffContact: () => void;
}) {
  const { t } = useTranslation(["profile", "common"]);
  const catalogLabel = useCatalogLabel();
  const dateFnsLocale = useDateFnsLocale();
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
                  {catalogLabel(c.category)}
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
                  {catalogLabel(cat)}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 w-full">
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
            <span className="flex-1 min-w-2" aria-hidden />
            {canRegularContact ? (
              <Button type="button" variant="secondary" size="sm" className="rounded-full shrink-0" onClick={onOpenContact}>
                {t("promoFeed.contact")}
              </Button>
            ) : null}
            {showStaffPromoActions ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full gap-1.5 border-primary/40 text-primary shrink-0"
                onClick={onOpenStaffContact}
              >
                <Shield className="h-3.5 w-3.5" />
                {t("promoFeed.staffContact")}
              </Button>
            ) : null}
          </div>

          {!user ? (
            <p className="text-xs text-muted-foreground">
              <Trans
                i18nKey="promoFeed.loginPrompt"
                ns="profile"
                components={{
                  link: (
                    <Link
                      to="/auth"
                      className="text-primary font-medium underline-offset-2 hover:underline"
                    />
                  ),
                }}
              />
            </p>
          ) : null}

          {expanded && (
            <div className="space-y-4 pt-2 border-t border-border/60">
              <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
                {post.comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("promoFeed.noComments")}</p>
                ) : (
                  post.comments.map((cm) => (
                    <div key={cm.id} className="rounded-xl bg-muted/40 px-3 py-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          {cm.author?.first_name || t("promoFeed.participant")}{" "}
                          {cm.author?.last_name ? `${cm.author.last_name[0]}.` : ""}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {format(new Date(cm.created_at), "d MMM HH:mm", { locale: dateFnsLocale })}
                        </span>
                      </div>
                      {cm.is_quote_request ? (
                        <Badge variant="outline" className="text-[10px] mb-1 border-primary/40 text-primary">
                          {t("promoFeed.quoteBadge")}
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
                    {t("promoFeed.commentsPublic")}{" "}
                    {canRegularContact
                      ? t("promoFeed.commentsContact")
                      : showStaffPromoActions
                        ? t("promoFeed.commentsStaff")
                        : t("promoFeed.commentsUnavailable")}
                  </p>
                  <Textarea
                    placeholder={t("promoFeed.commentPlaceholder")}
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
                      {t("promoFeed.quoteCheckbox")}
                    </Label>
                  </div>
                  <Button
                    type="button"
                    className="w-full rounded-xl gap-2"
                    disabled={commentPending}
                    onClick={onSubmitComment}
                  >
                    {commentPending ? (
                      t("common:sending")
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {t("promoFeed.send")}
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
  const { t } = useTranslation(["profile", "common"]);
  const catalogLabel = useCatalogLabel();
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

  const [staffPromoOpen, setStaffPromoOpen] = useState(false);
  const [staffPromoCompanyId, setStaffPromoCompanyId] = useState("");
  const [staffPromoCompanyName, setStaffPromoCompanyName] = useState("");
  const [staffPromoPostId, setStaffPromoPostId] = useState("");
  const [staffPromoPostTitle, setStaffPromoPostTitle] = useState("");

  useEffect(() => {
    if (!highlightPostId || !posts?.length) return;
    const el = postAnchors.current[highlightPostId];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightPostId, posts]);

  const openStaffPromoContact = (companyId: string, companyName: string, postId: string, postTitle: string) => {
    if (!user || !caps.isStaff) return;
    setStaffPromoCompanyId(companyId);
    setStaffPromoCompanyName(companyName);
    setStaffPromoPostId(postId);
    setStaffPromoPostTitle(postTitle.trim());
    setStaffPromoOpen(true);
  };

  const openContact = (companyId: string, companyName: string, postId: string, postTitle: string) => {
    if (caps.isStaff) {
      toast.error(t("promoFeed.staffOnlyContact"));
      return;
    }
    if (!user) {
      toast.error(t("promoFeed.loginToRequest"));
      navigate(authPath(`${location.pathname}${location.search}`));
      return;
    }
    setContactCompanyId(companyId);
    setContactCompanyName(companyName);
    setContactPostId(postId);
    setContactPostTitle(postTitle.trim());
    setRequestTitle(
      postTitle.trim()
        ? t("promoFeed.requestTitleTemplate", { title: postTitle.trim() })
        : t("promoFeed.requestTitleCompany", { company: companyName }),
    );
    setRequestDescription("");
    setContactOpen(true);
  };

  const submitRequest = async () => {
    if (!requestTitle.trim()) {
      toast.error(t("promoFeed.subjectRequired"));
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
            ? t("marketplace:promoFeedContact.videoDetail", { title: contactPostTitle.trim() })
            : t("marketplace:promoFeedContact.showcaseDetail", { company: contactCompanyName }),
          url: feedUrl,
        }),
      });
      toast.success(t("promoFeed.requestSent"));
      openRequestChat(navigate, req.id);
      setContactOpen(false);
      setContactPostId("");
      setContactPostTitle("");
    } catch {
      toast.error(t("promoFeed.requestError"));
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

      <PageHero
        align="center"
        eyebrow={t("promoFeed.eyebrow")}
        eyebrowIcon={Clapperboard}
        title={
          <>
            {t("promoFeed.titlePrefix")}{" "}
            <span className="gradient-text">{t("promoFeed.titleHighlight")}</span>
          </>
        }
        description={
          <>
            {t("promoFeed.descBase")}
            {!caps.isStaff && hasCompanies ? (
              <>
                {" "}
                <Trans
                  i18nKey="promoFeed.descManage"
                  ns="profile"
                  components={{
                    link: (
                      <Link
                        to="/profile?tab=companies"
                        className="text-primary font-semibold underline-offset-2 hover:underline"
                      />
                    ),
                  }}
                />
              </>
            ) : user && !caps.isStaff ? (
              <>
                {" "}
                <Trans
                  i18nKey="promoFeed.descCreate"
                  ns="profile"
                  components={{
                    link: (
                      <Link
                        to="/create-company"
                        className="text-primary font-semibold underline-offset-2 hover:underline"
                      />
                    ),
                  }}
                />
              </>
            ) : null}
          </>
        }
      />

      <PageContent className="border-b-0">
      <div className="max-w-lg mx-auto space-y-8 pb-10">
        <StaffBrowsingBanner />
        <div className="rounded-2xl border bg-card/80 p-4 space-y-3 shadow-sm">
          <p className="text-sm font-medium text-foreground">{t("promoFeed.filtersTitle")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("promoFeed.companyCity")}</Label>
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t("common:city")} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">{t("common:allCities")}</SelectItem>
                  {KAZAKHSTAN_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("promoFeed.videoTopic")}</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t("common:category")} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">{t("common:allCategories")}</SelectItem>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {catalogLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>{t("promoFeed.freshPosts")}</span>
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
                    ? t("promoFeed.emptyFiltered")
                    : t("promoFeed.emptyTitle")}
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {filterCity !== "all" || filterCategory !== "all"
                    ? t("promoFeed.emptyFilteredDesc")
                    : t("promoFeed.emptyDesc")}
                </p>
              </div>
              {!caps.isStaff && hasCompanies ? (
                <Button asChild variant="default" className="rounded-xl">
                  <Link to="/profile">{t("promoFeed.myCompanies")}</Link>
                </Button>
              ) : user && !caps.isStaff ? (
                <Button asChild variant="default" className="rounded-xl">
                  <Link to="/create-company">{t("promoFeed.createCompany")}</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to={authPath("/feed")}>{t("common:signIn")}</Link>
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
                const content = raw || (quote ? t("promoFeed.defaultQuote") : "");
                if (!content) {
                  toast.error(t("promoFeed.commentRequired"));
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
                  toast.success(t("promoFeed.commentPublished"));
                } catch {
                  toast.error(t("promoFeed.commentError"));
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
                  toast.error(t("promoFeed.likeError"));
                }
              }}
              likePending={toggleLike.isPending && toggleLike.variables?.postId === post.id}
              onOpenContact={() =>
                openContact(post.company_id, post.company.name, post.id, post.title || "")
              }
              canRegularContact={caps.canContactCompany(post.company.owner_id)}
              showStaffPromoActions={
                caps.isStaff && profile?.id !== post.company.owner_id
              }
              onOpenStaffContact={() =>
                openStaffPromoContact(post.company_id, post.company.name, post.id, post.title || "")
              }
            />
            </div>
          ))
        )}
      </div>
      </PageContent>

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
            <DialogTitle>{t("promoFeed.requestDialogTitle")}</DialogTitle>
            <DialogDescription>
              {contactCompanyName ? t("promoFeed.requestDialogDesc", { company: contactCompanyName }) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>{t("promoFeed.requestSubject")}</Label>
              <Input value={requestTitle} onChange={(e) => setRequestTitle(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>{t("promoFeed.requestDetails")}</Label>
              <Textarea
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                rows={4}
                className="rounded-xl resize-none"
                placeholder={t("promoFeed.requestDetailsPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setContactOpen(false)}>
              {t("common:cancel")}
            </Button>
            <Button className="rounded-xl" onClick={submitRequest} disabled={createRequest.isPending}>
              {createRequest.isPending ? t("common:sending") : t("promoFeed.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModeratorPromoContactDialog
        open={staffPromoOpen}
        onOpenChange={setStaffPromoOpen}
        companyId={staffPromoCompanyId}
        companyName={staffPromoCompanyName}
        postId={staffPromoPostId}
        postTitle={staffPromoPostTitle}
      />
    </div>
  );
};

export default PromoFeed;
