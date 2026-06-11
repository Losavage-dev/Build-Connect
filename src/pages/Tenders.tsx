import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authPath } from "@/lib/authRedirect";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useCapabilities } from "@/hooks/useCapabilities";
import { useTenders, useCreateTender, useUpdateTender, type Tender, type TenderStatus } from "@/hooks/useTenders";
import { useCreateRequest } from "@/hooks/useRequests";
import { useMyActiveTenderBids } from "@/hooks/useMyActiveTenderBids";
import { buildRequestSource } from "@/lib/requestSource";
import { openRequestChat } from "@/lib/openRequestChat";
import { formatSupabaseError } from "@/lib/formatSupabaseError";
import { DuplicateTenderBidError } from "@/lib/tenderBidGuard";
import { useMyCompanies } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarketplaceFilterLayout } from "@/components/MarketplaceFilterLayout";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { TenderCard } from "@/components/TenderCard";
import { StaffBrowsingBanner } from "@/components/StaffBrowsingBanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KAZAKHSTAN_CITIES, TENDER_TYPES, type TenderTypeValue } from "@/lib/constants";
import { useRecommendedTenders, useSortedTenders } from "@/hooks/useRecommendations";
import { RecommendedTendersSection } from "@/components/RecommendedTendersSection";
import type { SortMode } from "@/lib/recommendations";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHero, PageContent, EmptyState } from "@/components/layout/PageHero";
import { useTenderTypeLabel } from "@/lib/i18nCatalog";

const Tenders = () => {
  const { t } = useTranslation(["marketplace", "common"]);
  const tenderTypeLabel = useTenderTypeLabel();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const returnTo = `${location.pathname}${location.search}`;
  const { user, profile } = useAuth();
  const caps = useCapabilities();
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [cityFilter, setCityFilter] = useState<string>(searchParams.get("city") || "all");
  const [search, setSearch] = useState<string>(searchParams.get("search") || "");

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "all");
    setCityFilter(searchParams.get("city") || "all");
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  const { data: tenders, isLoading, isError, error, refetch } = useTenders({
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const createTender = useCreateTender();
  const updateTender = useUpdateTender();
  const createRequest = useCreateRequest();
  const { data: myCompanies } = useMyCompanies(profile?.id);
  const { data: activeTenderBids } = useMyActiveTenderBids(profile?.id);

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("for_you");

  const listingIdFromUrl = searchParams.get("listing") || searchParams.get("tender");

  const filteredTenders = useMemo(() => {
    if (!tenders?.length) return [];
    const q = search.trim().toLowerCase();
    let list = tenders.filter((tender) => {
      if (cityFilter !== "all" && (tender.city || "") !== cityFilter) return false;
      if (typeFilter !== "all" && (tender.tender_type || "subcontract") !== typeFilter) return false;
      if (!q) return true;
      const typeLabel =
        tenderTypeLabel((tender.tender_type || "subcontract") as TenderTypeValue) || "";
      return `${tender.title} ${tender.description || ""} ${tender.city || ""} ${typeLabel}`.toLowerCase().includes(q);
    });
    if (listingIdFromUrl && !list.some((tender) => tender.id === listingIdFromUrl)) {
      const highlighted = tenders.find((tender) => tender.id === listingIdFromUrl);
      if (highlighted) list = [highlighted, ...list];
    }
    return list;
  }, [tenders, search, cityFilter, typeFilter, listingIdFromUrl, tenderTypeLabel]);

  const sortedTenders = useSortedTenders(filteredTenders, sortMode);
  const recommendedTenders = useRecommendedTenders(tenders);

  useEffect(() => {
    const listingId = searchParams.get("listing") || searchParams.get("tender");
    if (!listingId || !filteredTenders.length) return;
    const el = document.getElementById(`tender-listing-${listingId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    const timer = window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [searchParams, filteredTenders]);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tenderCity, setTenderCity] = useState("");
  const [tenderType, setTenderType] = useState<TenderTypeValue>("subcontract");

  const handleResetFilters = () => {
    setStatusFilter("all");
    setCityFilter("all");
    setTypeFilter("all");
    setSearch("");
    setSearchParams({});
  };

  const filterFields = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">{t("tenders.status")}</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t("tenders.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("tenders.allStatuses")}</SelectItem>
            <SelectItem value="open">{t("tenders.statusOpen")}</SelectItem>
            <SelectItem value="in_progress">{t("tenders.statusInProgress")}</SelectItem>
            <SelectItem value="closed">{t("tenders.statusClosed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">{t("tenders.taskType")}</label>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t("tenders.taskType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("tenders.allTypes")}</SelectItem>
            {TENDER_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {tenderTypeLabel(type.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">{t("tenders.workCity")}</label>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t("common:city")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common:allCities")}</SelectItem>
            {KAZAKHSTAN_CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" className="w-full" onClick={handleResetFilters}>
        {t("common:resetFilters")}
      </Button>
    </div>
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!tenderCity) {
      toast.error(t("tenders.specifyWorkCity"));
      return;
    }

    try {
      await createTender.mutateAsync({
        client_id: profile.id,
        title,
        description,
        city: tenderCity,
        tender_type: tenderType,
        budget: budget ? Number(budget) : undefined,
        deadline: deadline || undefined,
      });
      toast.success(t("tenders.createSuccess"));
      setOpen(false);
      setTitle("");
      setDescription("");
      setBudget("");
      setDeadline("");
      setTenderCity("");
      setTenderType("subcontract");
    } catch {
      toast.error(t("tenders.createError"));
    }
  };

  const handleBid = async (tender: Tender, bidCompanyId: string, bidDescription: string) => {
    if (!bidCompanyId || !profile) {
      toast.error(t("tenders.selectCompanyForBid"));
      return;
    }

    if (tender.client_id === profile.id) {
      toast.error(t("tenders.cannotBidOwn"));
      return;
    }

    const { data: authorCompanies, error: qErr } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", tender.client_id);

    if (qErr) {
      toast.error(t("tenders.cannotVerifyAuthor"));
      return;
    }

    const authorCompanyIds = new Set((authorCompanies || []).map((c) => c.id));
    if (authorCompanyIds.has(bidCompanyId)) {
      toast.error(t("tenders.cannotBidAuthorCompany"));
      return;
    }

    const myCompany = myCompanies?.find((c) => c.id === bidCompanyId);
    const messageBody = bidDescription.trim();

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const payload = {
        title: t("marketplace:orders.tenderBidTitle", { title: tender.title }),
        description: messageBody || null,
        initial_message: messageBody || undefined,
        acting_company_name: myCompany?.name,
        source_tender_id: tender.id,
        source: buildRequestSource({
          kind: "tender",
          detail: `«${tender.title}»`,
          url: `${origin}/tenders?listing=${encodeURIComponent(tender.id)}`,
        }),
      };

      const req = await createRequest.mutateAsync({
        ...payload,
        company_id: bidCompanyId,
        recipient_profile_id: tender.client_id,
      });

      toast.success(t("tenders.bidSent"));
      openRequestChat(navigate, req.id);
    } catch (err) {
      if (err instanceof DuplicateTenderBidError) {
        toast.info(t("tenders.alreadyBid"));
        if (err.existingRequestId !== "existing") {
          openRequestChat(navigate, err.existingRequestId);
        }
        return;
      }
      console.error("Bid failed:", err);
      toast.error(formatSupabaseError(err, t("tenders.bidError")));
    }
  };

  const handleStatusChange = async (tenderId: string, status: TenderStatus) => {
    try {
      await updateTender.mutateAsync({ id: tenderId, status });
      toast.success(t("tenders.statusUpdated"));
    } catch {
      toast.error(t("tenders.statusUpdateError"));
    }
  };

  const TenderSkeleton = () => (
    <Card className="border-2 border-transparent">
      <CardContent className="p-6">
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageHero
        eyebrow={t("tenders.eyebrow")}
        eyebrowIcon={FileText}
        title={t("tenders.title")}
        description={
          isLoading
            ? t("common:loading")
            : t("tenders.foundFiltered", {
                filtered: filteredTenders.length,
                total: tenders?.length || 0,
              })
        }
        compact
        actions={
          !user ? (
            <Button asChild className="rounded-xl font-semibold btn-glow">
              <Link to={authPath(returnTo)}>{t("tenders.loginToCreate")}</Link>
            </Button>
          ) : caps.canCreateTender() ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl font-semibold gap-2 btn-glow">
                  <Plus className="h-4 w-4" />
                  {t("tenders.create")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle>{t("tenders.newTender")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tender-title">{t("tenders.name")}</Label>
                    <Input
                      id="tender-title"
                      placeholder={t("tenders.titlePlaceholder")}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-desc">{t("tenders.description")}</Label>
                    <Textarea
                      id="tender-desc"
                      placeholder={t("tenders.descPlaceholder")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("tenders.taskType")}</Label>
                    <Select value={tenderType} onValueChange={(v) => setTenderType(v as TenderTypeValue)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("tenders.selectType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {TENDER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {tenderTypeLabel(type.value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("tenders.workCity")}</Label>
                    <Select value={tenderCity} onValueChange={setTenderCity} required>
                      <SelectTrigger id="tender-city">
                        <SelectValue placeholder={t("common:selectCity")} />
                      </SelectTrigger>
                      <SelectContent>
                        {KAZAKHSTAN_CITIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tender-budget">{t("tenders.budgetLabel")}</Label>
                      <Input
                        id="tender-budget"
                        type="number"
                        placeholder={t("tenders.budgetPlaceholder")}
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tender-deadline">{t("tenders.deadline")}</Label>
                      <Input
                        id="tender-deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-xl"
                    disabled={createTender.isPending}
                  >
                    {createTender.isPending ? t("common:creating") : t("tenders.publish")}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <PageContent>
        <StaffBrowsingBanner />

        <MarketplaceFilterLayout filterContent={filterFields}>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <Input
              placeholder={t("tenders.searchPlaceholder")}
              className="max-w-md rounded-xl bg-card/80 border-border/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Tabs value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
              <TabsList className="rounded-xl">
                <TabsTrigger value="for_you">{t("common:forYou")}</TabsTrigger>
                <TabsTrigger value="rating">{t("common:sortByDate")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

        {!isLoading && recommendedTenders.length > 0 && (
          <RecommendedTendersSection items={recommendedTenders} />
        )}

        {isError ? (
          <QueryErrorBlock error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <TenderSkeleton key={i} />
            ))}
          </div>
        ) : tenders?.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t("tenders.emptyTitle")}
            description={t("tenders.emptyDesc")}
          />
        ) : tenders && tenders.length > 0 && filteredTenders.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t("common:notFound")}
            description={t("common:changeFiltersOrSearch")}
            action={
              <Button variant="outline" className="rounded-xl" onClick={handleResetFilters}>
                {t("common:resetFilters")}
              </Button>
            }
          />
        ) : sortedTenders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedTenders.map((tender) => (
              <TenderCard
                key={tender.id}
                tender={tender}
                user={user}
                profile={profile}
                caps={caps}
                returnTo={returnTo}
                myCompanies={myCompanies}
                existingBidRequestId={activeTenderBids?.get(tender.id) ?? null}
                onBid={handleBid}
                bidPending={createRequest.isPending}
                onStatusChange={handleStatusChange}
                statusUpdatePending={updateTender.isPending}
              />
            ))}
          </div>
        ) : null}
        </MarketplaceFilterLayout>
      </PageContent>
    </div>
  );
};

export default Tenders;
