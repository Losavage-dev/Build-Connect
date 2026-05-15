import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { authPath } from "@/lib/authRedirect";
import { MapPin, Star, Phone, Mail, Globe, ArrowLeft, Loader2, Send, Image as ImageIcon, Settings, Clapperboard } from "lucide-react";
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
import { useCompanyPromoPosts } from "@/hooks/usePromoFeed";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { companyCategoryLabel } from "@/lib/companyDisplay";
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
import {
  VERIFICATION_STATUS_HINTS,
  VERIFICATION_STATUS_LABELS,
  type CompanyVerificationStatus,
} from "@/lib/companyVerification";
import { ReportDialog } from "@/components/ReportDialog";
import { useReviewEligibility, reviewBlockMessage } from "@/hooks/useReviewEligibility";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { PortfolioProjectCard } from "@/components/PortfolioProjectCard";
import { useTrackUserEvent } from "@/hooks/useUserEvents";

const CompanyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  const { user, profile } = useAuth();
  const caps = useCapabilities();
  const { data: company, isLoading, error, isError, refetch } = useCompany(id);
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
      toast.error("Войдите, чтобы отправить заявку");
      navigate(authPath(returnTo));
      return;
    }

    if (!requestTitle.trim()) {
      toast.error("Введите тему заявки");
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
          detail: `«${company?.name || "компания"}»`,
          url: `${origin}/company/${id}`,
        }),
      });
      toast.success("Заявка отправлена — откройте чат для переписки.");
      openRequestChat(navigate, req.id);
      setIsDialogOpen(false);
      setRequestTitle("");
      setRequestDescription("");
    } catch (error) {
      toast.error("Ошибка при отправке заявки");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <Skeleton className="w-20 h-20 rounded-lg" />
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="w-80 h-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-8">
          <QueryErrorBlock title="Не удалось загрузить компанию" error={error} onRetry={() => refetch()} />
          <div className="text-center mt-4">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/catalog">Вернуться в каталог</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-8 text-center">
          <p className="text-destructive mb-4">Компания не найдена</p>
          <Button asChild>
            <Link to="/catalog">Вернуться в каталог</Link>
          </Button>
        </div>
      </div>
    );
  }

  const categoryLabel = companyCategoryLabel(company);
  const categoryList =
    company.company_categories?.map((r: { category: string }) => r.category).filter(Boolean) ??
    (company.category ? [company.category] : []);

  const projects = company.projects || [];
  const services = company.company_services || [];
  const reviews = company.reviews || [];
  const reviewStats = statsFromCompanyRow(company);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/catalog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к каталогу
          </Link>
        </Button>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 rounded-lg bg-background flex items-center justify-center text-3xl font-bold text-primary">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    company.name.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold">{company.name}</h1>
                    {company.is_verified ? <VerifiedBadge size="md" /> : null}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {categoryList.map((cat: string) => (
                      <Badge key={cat} variant="secondary">
                        {cat}
                      </Badge>
                    ))}
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{company.city}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-lg text-muted-foreground mb-6">{company.description}</p>
              
              <div className="mb-6">
                <CompanyRatingBadge stats={reviewStats} size="md" />
              </div>

              {profile && company.owner_id === profile.id && (
                <div className="space-y-3">
                  {(company as { verification_status?: CompanyVerificationStatus }).verification_status !==
                  "verified" ? (
                    <Alert>
                      <AlertTitle>
                        {VERIFICATION_STATUS_LABELS[
                          ((company as { verification_status?: CompanyVerificationStatus }).verification_status ||
                            "draft") as CompanyVerificationStatus
                        ]}
                      </AlertTitle>
                      <AlertDescription>
                        {VERIFICATION_STATUS_HINTS[
                          ((company as { verification_status?: CompanyVerificationStatus }).verification_status ||
                            "draft") as CompanyVerificationStatus
                        ]}{" "}
                        <Link to={`/company/${id}/manage?tab=verification`} className="text-primary font-medium underline">
                          Перейти к верификации
                        </Link>
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to={`/company/${id}/manage`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Управление компанией
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <Card className="md:w-80 shrink-0">
              <CardHeader>
                <CardTitle>Контакты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors break-all">
                      {company.website}
                    </a>
                  </div>
                )}
                {!user ? (
                  <>
                    <Separator />
                    <Button asChild className="w-full" size="lg">
                      <Link to={authPath(returnTo)}>
                        <Send className="h-4 w-4 mr-2" />
                        Войти, чтобы отправить заявку
                      </Link>
                    </Button>
                  </>
                ) : caps.canContactCompany(company.owner_id) ? (
                  <>
                    <Separator />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="lg">
                          <Send className="h-4 w-4 mr-2" />
                          Отправить заявку
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader className="space-y-2 text-left">
                          <DialogTitle className="text-2xl font-bold tracking-tight">Отправить заявку</DialogTitle>
                          <DialogDescription className="text-base text-muted-foreground">
                            Сообщение из поля ниже уйдёт в чат с компанией первым. Тема заявки будет видна в шапке диалога.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="title" className="text-base font-semibold">
                              Тема заявки <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="title"
                              placeholder="Например: Строительство дома"
                              value={requestTitle}
                              onChange={(e) => setRequestTitle(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description" className="text-base font-semibold">
                              Сообщение в чат
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Этот текст сразу появится у {company.name} в переписке (отдельно от служебной ссылки на
                              карточку).
                            </p>
                            <Textarea
                              id="description"
                              placeholder="Опишите ваш проект или вопрос..."
                              rows={4}
                              value={requestDescription}
                              onChange={(e) => setRequestDescription(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Отмена
                          </Button>
                          <Button onClick={handleSubmitRequest} disabled={createRequest.isPending}>
                            {createRequest.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Отправка...
                              </>
                            ) : (
                              "Отправить"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Видео компании (витрина) — сразу под шапкой, чтобы не терялись под услугами */}
            {(promoPosts.length > 0 || (profile && company.owner_id === profile.id)) && (
              <Card className="border-primary/15 shadow-sm shadow-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clapperboard className="h-5 w-5 text-primary" />
                    Видео компании
                  </CardTitle>
                  <CardDescription>
                    Ролики, которые владелец добавил в разделе управления компанией (YouTube). Общая лента —{" "}
                    <Link to="/feed" className="text-primary font-medium underline-offset-2 hover:underline">
                      Витрина роликов
                    </Link>
                    .
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
                                {topics.map((t) => (
                                  <Badge key={t} variant="outline" className="text-xs font-normal">
                                    {t}
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
                      <p className="text-sm text-muted-foreground">
                        В публичном профиле пока нет роликов. Добавьте ссылку на YouTube во вкладке «Видео» в
                        управлении компанией — они появятся здесь и в общей витрине.
                      </p>
                      <Button asChild variant="default" className="rounded-xl">
                        <Link to={`/company/${id}/manage`}>
                          <Settings className="h-4 w-4 mr-2" />
                          Управление → Видео
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {services.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Услуги</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {services.map((service: any) => (
                      <Badge key={service.id} variant="secondary">
                        {service.name}
                        {service.price_from && (
                          <span className="ml-1 text-xs">
                            от {service.price_from.toLocaleString()} ₸
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            <Card>
              <CardHeader>
                <CardTitle>Портфолио</CardTitle>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {projects.map((project: any) => (
                      <PortfolioProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6">Проекты пока не добавлены</p>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card id="reviews">
              <CardHeader>
                <CardTitle>Отзывы ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review: any, index: number) => (
                    <div key={review.id}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">
                            {review.author?.first_name || "Пользователь"} {review.author?.last_name?.[0] || ""}.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(review.created_at), "d MMM yyyy", { locale: ru })}
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
                  <p className="text-muted-foreground text-center py-6">Отзывов пока нет</p>
                )}

                {user && profile?.id !== company.owner_id ? (
                  <>
                    <Separator className="my-6" />
                    {reviewEligibilityLoading ? (
                      <p className="text-sm text-muted-foreground">Проверка возможности оставить отзыв…</p>
                    ) : (
                      <ReviewForm
                        companyId={id!}
                        disabled={!reviewEligibility?.canReview}
                        blockMessage={reviewBlockMessage(reviewEligibility?.reason)}
                      />
                    )}
                  </>
                ) : !user ? (
                  <>
                    <Separator className="my-6" />
                    <p className="text-sm text-muted-foreground">
                      {reviewBlockMessage("guest")}{" "}
                      <Link to={authPath(returnTo)} className="text-primary hover:underline">
                        Войти
                      </Link>
                    </p>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>О компании</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Категория</p>
                  <p className="text-muted-foreground">{categoryLabel}</p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium mb-1">Город</p>
                  <p className="text-muted-foreground">{company.city}</p>
                </div>
                {company.address && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium mb-1">Адрес</p>
                      <p className="text-muted-foreground">{company.address}</p>
                    </div>
                  </>
                )}
                <Separator />
                <div>
                  <p className="font-medium mb-1">Проектов в портфолио</p>
                  <p className="text-muted-foreground">{projects.length}</p>
                </div>
                {user && profile?.id !== company.owner_id ? (
                  <>
                    <Separator />
                    <ReportDialog
                      targetType="company"
                      targetId={company.id}
                      targetLabel={company.name}
                      variant="outline"
                      triggerClassName="w-full rounded-xl"
                    />
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
