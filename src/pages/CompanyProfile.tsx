import { useState, useEffect, useRef } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { authPath } from "@/lib/authRedirect";
import { Star, Phone, Mail, Globe, ArrowLeft, Loader2, Send, Settings, Clapperboard, Building2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { useCompany } from "@/hooks/useCompanies";
import { useCompanyVitrineListings } from "@/hooks/useServices";
import { useCompanyPromoPosts } from "@/hooks/usePromoFeed";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { useCreateRequest } from "@/hooks/useRequests";
import { buildRequestSource } from "@/lib/requestSource";
import { openRequestChat } from "@/lib/openRequestChat";
import { useAuth } from "@/contexts/AuthContext";
import { useCapabilities } from "@/hooks/useCapabilities";
import CompanyRatingBadge from "@/components/CompanyRatingBadge";
import { statsFromCompanyRow } from "@/lib/companyReviewStats";
import { toast } from "sonner";
import ReviewForm from "@/components/ReviewForm";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type CompanyVerificationStatus } from "@/lib/companyVerification";
import { ReportDialog } from "@/components/ReportDialog";
import { useReviewEligibility } from "@/hooks/useReviewEligibility";
import { format } from "date-fns";
import { useDateFnsLocale } from "@/hooks/useAppFormat";
import { useCatalogLabel } from "@/lib/i18nCatalog";

import { PortfolioProjectCard } from "@/components/PortfolioProjectCard";
import { CompanyLogo } from "@/components/CompanyLogo";
import { useTrackUserEvent } from "@/hooks/useUserEvents";
import { PageHero, PageContent } from "@/components/layout/PageHero";
import { CompanyCompareToggleButton } from "@/components/CompanyCompareBar";
import { CompanyPrivateDetailsGate } from "@/components/CompanyPrivateDetailsGate";
import { canViewCompanyPrivateDetails } from "@/lib/companyContactAccess";

const verificationHintKey = (status: CompanyVerificationStatus) =>
  `company.verification.hint${status.charAt(0).toUpperCase()}${status.slice(1)}`;

const CompanyProfile = () => {
  const { t } = useTranslation(["profile", "common", "catalogData"]);
  const dateFnsLocale = useDateFnsLocale();
  const catalogLabel = useCatalogLabel();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  const { user, profile } = useAuth();
  const caps = useCapabilities();
  const canViewPrivate = canViewCompanyPrivateDetails(!!user);
  const { data: company, isLoading, error, isError, refetch } = useCompany(id);
  const { data: vitrine } = useCompanyVitrineListings(id);
  const { data: promoPosts = [] } = useCompanyPromoPosts(id);
  const createRequest = useCreateRequest();
  const { data: reviewEligibility, isLoading: reviewEligibilityLoading } = useReviewEligibility(
    id,
    company?.owner_id,
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const { track } = useTrackUserEvent();
  const viewedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!company?.id || viewedRef.current === company.id) return;
    viewedRef.current = company.id;
    const categories =
      (company as { company_categories?: { category: string }[] }).company_categories?.map(
        (c) => c.category,
      ) ?? [];
    track("view_company", "company", company.id, {
      categories,
      category: company.category,
      city: company.city,
    });
  }, [company, track]);

  const handleSubmitRequest = async () => {
    if (!user) {
      toast.error(t("company.loginRequired"));
      navigate(authPath(returnTo));
      return;
    }

    if (!requestTitle.trim()) {
      toast.error(t("company.subjectRequired"));
      return;
    }

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const req = await createRequest.mutateAsync({
        company_id: id!,
        title: requestTitle,
        description: requestDescription,
        initial_message: requestDescription.trim() || undefined,
        source: buildRequestSource({
          kind: "catalog",
          detail: `«${company?.name || t("company.eyebrow")}»`,
          url: `${origin}/company/${id}`,
        }),
      });
      toast.success(t("company.requestSent"));
      openRequestChat(navigate, req.id);
      setIsDialogOpen(false);
      setRequestTitle("");
      setRequestDescription("");
    } catch (error) {
      toast.error(t("company.requestError"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero eyebrow={t("company.eyebrow")} title={t("company.loading")} compact />
        <PageContent className="border-b-0">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Skeleton className="h-64 lg:col-span-2 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </div>
        </PageContent>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero eyebrow={t("company.eyebrow")} title={t("company.loadError")} compact />
        <PageContent className="border-b-0">
          <div className="max-w-3xl mx-auto">
            <QueryErrorBlock title={t("company.loadErrorTitle")} error={error} onRetry={() => refetch()} />
            <div className="text-center mt-4">
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/catalog">{t("company.backToCatalog")}</Link>
              </Button>
            </div>
          </div>
        </PageContent>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero eyebrow={t("company.eyebrow")} title={t("company.notFound")} compact />
        <PageContent className="border-b-0">
          <div className="max-w-3xl mx-auto text-center py-8">
            <p className="text-destructive mb-4">{t("company.notFoundMessage")}</p>
            <Button asChild className="rounded-xl">
              <Link to="/catalog">{t("company.backToCatalog")}</Link>
            </Button>
          </div>
        </PageContent>
      </div>
    );
  }

  const categoryList =
    company.company_categories?.map((r: { category: string }) => r.category).filter(Boolean) ??
    (company.category ? [company.category] : []);

  const heroDescription =
    [company.description?.trim(), company.city].filter(Boolean).join(" · ") || undefined;

  const projects = company.projects || [];
  const reviews = company.reviews || [];
  const reviewStats = statsFromCompanyRow(company);
  const vitrineMaterials = vitrine?.materials.length ?? 0;
  const vitrineServices = vitrine?.services.length ?? 0;
  const vitrineTotal = vitrineMaterials + vitrineServices;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageHero
        eyebrow={t("company.eyebrow")}
        eyebrowIcon={Building2}
        media={<CompanyLogo name={company.name} logoUrl={company.logo_url} size="md" />}
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            {company.name}
            {company.is_verified ? <VerifiedBadge size="md" /> : null}
          </span>
        }
        description={
          <>
            {heroDescription ? <p>{heroDescription}</p> : null}
            <CompanyRatingBadge stats={reviewStats} size="sm" />
          </>
        }
        compact
        actions={
          <div className="flex flex-wrap gap-2">
            {company.verification_status === "verified" || company.is_verified ? (
              <CompanyCompareToggleButton companyId={company.id} companyName={company.name} />
            ) : null}
            <Button variant="ghost" asChild className="rounded-xl">
              <Link to="/catalog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("company.backToCatalogShort")}
              </Link>
            </Button>
          </div>
        }
      />

      <PageContent className="border-b-0">
        <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Видео компании (витрина) — сразу под шапкой, чтобы не терялись под услугами */}
            {(promoPosts.length > 0 || (profile && company.owner_id === profile.id)) && (
              <Card className="rounded-2xl border-border/60 bg-card/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clapperboard className="h-5 w-5 text-primary" />
                    {t("company.videos")}
                  </CardTitle>
                  <CardDescription>
                    <Trans
                      i18nKey="company.videosDesc"
                      ns="profile"
                      components={{
                        feedLink: (
                          <Link
                            to="/feed"
                            className="text-primary font-medium underline-offset-2 hover:underline"
                          />
                        ),
                      }}
                    />
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {promoPosts.length > 0 ? (
                    promoPosts.map(
                      (row: {
                        id: string;
                        youtube_video_id: string;
                        title: string;
                        caption: string | null;
                        company_promo_post_categories?: { category: string }[] | null;
                      }) => {
                        const topics =
                          row.company_promo_post_categories?.map((x) => x.category).filter(Boolean) ?? [];
                        return (
                          <div key={row.id} className="space-y-2">
                            <div className="relative aspect-video rounded-xl overflow-hidden border bg-black shadow-sm">
                              <iframe
                                title={row.title || company.name}
                                src={youtubeEmbedUrl(row.youtube_video_id)}
                                className="absolute inset-0 h-full w-full"
                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                loading="lazy"
                              />
                            </div>
                            {row.title ? <p className="font-semibold">{row.title}</p> : null}
                            {row.caption ? <p className="text-sm text-muted-foreground">{row.caption}</p> : null}
                            {topics.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {topics.map((topic) => (
                                  <Badge key={topic} variant="outline" className="text-xs font-normal">
                                    {catalogLabel(topic)}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      },
                    )
                  ) : (
                    <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center space-y-3">
                      <p className="text-sm text-muted-foreground">{t("company.videosEmpty")}</p>
                      <Button asChild variant="default" className="rounded-xl">
                        <Link to={`/company/${id}/manage`}>
                          <Settings className="h-4 w-4 mr-2" />
                          {t("company.manageVideos")}
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            <Card className="rounded-2xl border-border/60 bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle>{t("company.portfolio")}</CardTitle>
                {profile && company.owner_id === profile.id ? (
                  <CardDescription>{t("company.portfolioOwnerHint")}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {projects.map((project: any) => (
                      <PortfolioProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                ) : profile && company.owner_id === profile.id ? (
                  <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">{t("company.portfolioEmptyOwner")}</p>
                    <Button asChild variant="default" className="rounded-xl">
                      <Link to={`/company/${id}/manage?tab=projects`}>
                        <Settings className="h-4 w-4 mr-2" />
                        {t("company.manageProjects")}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6">{t("company.portfolioEmptyGuest")}</p>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="rounded-2xl border-border/60 bg-card/90 backdrop-blur" id="reviews">
              <CardHeader>
                <CardTitle>{t("company.reviews", { count: reviews.length })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review: any, index: number) => (
                    <div key={review.id}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">
                            {review.author?.first_name || t("company.anonymousUser")}{" "}
                            {review.author?.last_name?.[0] || ""}.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(review.created_at), "d MMM yyyy", { locale: dateFnsLocale })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground">{review.comment}</p>
                      )}
                      {index < reviews.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-6">{t("company.reviewsEmpty")}</p>
                )}

                {user && profile?.id !== company.owner_id ? (
                  <>
                    {reviewEligibilityLoading ? (
                      <>
                        <Separator className="my-6" />
                        <p className="text-sm text-muted-foreground">{t("company.reviewChecking")}</p>
                      </>
                    ) : reviewEligibility?.canReview ? (
                      <>
                        <Separator className="my-6" />
                        <ReviewForm companyId={id!} />
                      </>
                    ) : reviewEligibility?.reason === "already_reviewed" ||
                      reviewEligibility?.reason === "deal_in_progress" ? (
                      <>
                        <Separator className="my-6" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {reviewEligibility.reason === "already_reviewed"
                            ? t("company.reviewAlready")
                            : t("company.reviewInProgress")}
                        </p>
                      </>
                    ) : null}
                  </>
                ) : !user ? (
                  <>
                    <Separator className="my-6" />
                    <p className="text-sm text-muted-foreground">
                      {t("company.reviewGuest")}{" "}
                      <Link to={authPath(returnTo)} className="text-primary hover:underline">
                        {t("common:signIn")}
                      </Link>
                    </p>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-border/60 bg-card/90 backdrop-blur h-fit lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle>{t("company.contacts")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CompanyPrivateDetailsGate isAuthenticated={canViewPrivate} returnTo={returnTo}>
                  <>
                    {company.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <a href={`tel:${company.phone}`} className="hover:text-primary transition-colors break-all">
                          {company.phone}
                        </a>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <a href={`mailto:${company.email}`} className="hover:text-primary transition-colors break-all">
                          {company.email}
                        </a>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-start gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <a
                          href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors break-all"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                    {!company.phone && !company.email && !company.website ? (
                      <p className="text-sm text-muted-foreground">{t("company.contactsEmpty")}</p>
                    ) : null}
                  </>
                </CompanyPrivateDetailsGate>
                {!user ? (
                  <>
                    <Separator />
                    <Button asChild className="w-full rounded-xl" size="lg">
                      <Link to={authPath(returnTo)}>
                        <Send className="h-4 w-4 mr-2" />
                        {t("company.loginToRequest")}
                      </Link>
                    </Button>
                  </>
                ) : caps.canContactCompany(company.owner_id) ? (
                  <>
                    <Separator />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full rounded-xl" size="lg">
                          <Send className="h-4 w-4 mr-2" />
                          {t("company.sendRequest")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader className="space-y-2 text-left">
                          <DialogTitle className="text-2xl font-bold tracking-tight">
                            {t("company.requestDialogTitle")}
                          </DialogTitle>
                          <DialogDescription className="text-base text-muted-foreground">
                            {t("company.requestDialogDesc")}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="title" className="text-base font-semibold">
                              {t("company.requestSubject")} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="title"
                              placeholder={t("company.requestSubjectPlaceholder")}
                              value={requestTitle}
                              onChange={(e) => setRequestTitle(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description" className="text-base font-semibold">
                              {t("company.requestMessage")}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {t("company.requestMessageHint", { company: company.name })}
                            </p>
                            <Textarea
                              id="description"
                              placeholder={t("company.requestMessagePlaceholder")}
                              rows={4}
                              value={requestDescription}
                              onChange={(e) => setRequestDescription(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {t("common:cancel")}
                          </Button>
                          <Button onClick={handleSubmitRequest} disabled={createRequest.isPending}>
                            {createRequest.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common:sending")}
                              </>
                            ) : (
                              t("promoFeed.send")
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  {t("company.showcase")}
                </CardTitle>
                <CardDescription>
                  {vitrineTotal > 0
                    ? t("company.showcaseCount", {
                        materials: vitrineMaterials,
                        services: vitrineServices,
                      })
                    : t("company.showcaseEmpty")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link to={`/company/${id}/offerings`} state={{ from: `${location.pathname}${location.search}` }}>
                    {vitrineTotal > 0 ? t("company.openShowcase") : t("company.viewShowcase")}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle>{t("company.about")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {categoryList.length > 0 ? (
                  <div>
                    <p className="font-medium mb-2">{t("company.directions")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {categoryList.map((cat: string) => (
                        <Badge key={cat} variant="secondary" className="text-xs font-normal">
                          {catalogLabel(cat)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {categoryList.length > 0 ? <Separator /> : null}
                <div>
                  <p className="font-medium mb-1">{t("company.city")}</p>
                  <p className="text-muted-foreground">{company.city}</p>
                </div>
                <CompanyPrivateDetailsGate isAuthenticated={canViewPrivate} returnTo={returnTo}>
                  <>
                    {company.bin ? (
                      <>
                        <Separator />
                        <div>
                          <p className="font-medium mb-1">{t("company.bin")}</p>
                          <p className="text-muted-foreground font-mono">{company.bin}</p>
                        </div>
                      </>
                    ) : null}
                    {company.address ? (
                      <>
                        <Separator />
                        <div>
                          <p className="font-medium mb-1">{t("company.address")}</p>
                          <p className="text-muted-foreground">{company.address}</p>
                        </div>
                      </>
                    ) : null}
                    {!company.bin && !company.address ? (
                      <p className="text-sm text-muted-foreground">{t("company.detailsEmpty")}</p>
                    ) : null}
                  </>
                </CompanyPrivateDetailsGate>
                <Separator />
                <div>
                  <p className="font-medium mb-1">{t("company.portfolioCount")}</p>
                  <p className="text-muted-foreground">{projects.length}</p>
                </div>
                {user && profile?.id !== company.owner_id ? (
                  <>
                    <Separator />
                    <ReportDialog
                      targetType="company"
                      targetId={company.id}
                      targetLabel={company.name}
                      variant={caps.isStaff ? "moderator" : "user"}
                      triggerVariant="outline"
                      triggerClassName="w-full rounded-xl"
                    />
                  </>
                ) : null}
              </CardContent>
            </Card>

            {profile && company.owner_id === profile.id ? (
              <Card className="rounded-2xl border-border/60 bg-card/90 backdrop-blur">
                <CardHeader>
                  <CardTitle>{t("company.manage")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(company as { verification_status?: CompanyVerificationStatus }).verification_status !==
                  "verified" ? (
                    <Alert>
                      <AlertTitle>
                        {t(
                          `company.verification.${
                            ((company as { verification_status?: CompanyVerificationStatus })
                              .verification_status || "draft") as CompanyVerificationStatus
                          }`,
                        )}
                      </AlertTitle>
                      <AlertDescription>
                        {t(
                          verificationHintKey(
                            ((company as { verification_status?: CompanyVerificationStatus })
                              .verification_status || "draft") as CompanyVerificationStatus,
                          ),
                        )}{" "}
                        <Link to={`/company/${id}/manage?tab=verification`} className="text-primary font-medium underline">
                          {t("company.goToVerification")}
                        </Link>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link to={`/company/${id}/manage`}>
                      <Settings className="h-4 w-4 mr-2" />
                      {t("company.manageCompany")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
        </div>
      </PageContent>
    </div>
  );
};

export default CompanyProfile;
