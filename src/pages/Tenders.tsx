import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
import { buildRequestSource } from "@/lib/requestSource";
import { openRequestChat } from "@/lib/openRequestChat";
import { formatSupabaseError } from "@/lib/formatSupabaseError";
import { useMyCompanies } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MarketplaceFilterLayout } from "@/components/MarketplaceFilterLayout";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { TenderCard } from "@/components/TenderCard";
import { StaffBrowsingBanner } from "@/components/StaffBrowsingBanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KAZAKHSTAN_CITIES, TENDER_TYPES, TENDER_TYPE_LABELS, type TenderTypeValue } from "@/lib/constants";
import { useRecommendedTenders, useSortedTenders } from "@/hooks/useRecommendations";
import { RecommendedTendersSection } from "@/components/RecommendedTendersSection";
import type { SortMode } from "@/lib/recommendations";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Tenders = () => {
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

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("for_you");

  const listingIdFromUrl = searchParams.get("listing") || searchParams.get("tender");

  const filteredTenders = useMemo(() => {
    if (!tenders?.length) return [];
    const q = search.trim().toLowerCase();
    let list = tenders.filter((t) => {
      if (cityFilter !== "all" && (t.city || "") !== cityFilter) return false;
      if (typeFilter !== "all" && (t.tender_type || "subcontract") !== typeFilter) return false;
      if (!q) return true;
      const typeLabel = TENDER_TYPE_LABELS[(t.tender_type || "subcontract") as TenderTypeValue] || "";
      return `${t.title} ${t.description || ""} ${t.city || ""} ${typeLabel}`.toLowerCase().includes(q);
    });
    if (listingIdFromUrl && !list.some((t) => t.id === listingIdFromUrl)) {
      const highlighted = tenders.find((t) => t.id === listingIdFromUrl);
      if (highlighted) list = [highlighted, ...list];
    }
    return list;
  }, [tenders, search, cityFilter, typeFilter, listingIdFromUrl]);

  const sortedTenders = useSortedTenders(filteredTenders, sortMode);
  const recommendedTenders = useRecommendedTenders(tenders, 4);

  useEffect(() => {
    const listingId = searchParams.get("listing") || searchParams.get("tender");
    if (!listingId || !filteredTenders.length) return;
    const el = document.getElementById(`tender-listing-${listingId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    const t = window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    }, 2600);
    return () => window.clearTimeout(t);
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
        <label className="text-sm font-medium mb-2 block">Статус</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="open">Открыт</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="closed">Закрыт</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Тип задачи</label>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {TENDER_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Город работ</label>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Город" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все города</SelectItem>
            {KAZAKHSTAN_CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" className="w-full" onClick={handleResetFilters}>
        Сбросить фильтры
      </Button>
    </div>
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!tenderCity) {
      toast.error("Укажите город выполнения работ");
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
      toast.success("Тендер успешно создан!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setBudget("");
      setDeadline("");
      setTenderCity("");
      setTenderType("subcontract");
    } catch {
      toast.error("Ошибка при создании тендера");
    }
  };

  const handleBid = async (tender: Tender, bidCompanyId: string, bidDescription: string) => {
    if (!bidCompanyId || !profile) {
      toast.error("Выберите компанию для отклика");
      return;
    }

    if (tender.client_id === profile.id) {
      toast.error("Нельзя откликнуться на свой тендер");
      return;
    }

    const { data: authorCompanies, error: qErr } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_id", tender.client_id);

    if (qErr) {
      toast.error("Не удалось проверить данные автора тендера");
      return;
    }

    const authorCompanyIds = new Set((authorCompanies || []).map((c) => c.id));
    if (authorCompanyIds.has(bidCompanyId)) {
      toast.error("Нельзя откликнуться компанией автора тендера");
      return;
    }

    const myCompany = myCompanies?.find((c) => c.id === bidCompanyId);
    const messageBody = bidDescription.trim();

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const payload = {
        title: `Отклик на тендер: ${tender.title}`,
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

      const req = authorCompanies?.length
        ? await createRequest.mutateAsync({
            ...payload,
            company_id: authorCompanies[0].id,
          })
        : await createRequest.mutateAsync({
            ...payload,
            recipient_profile_id: tender.client_id,
          });

      toast.success("Отклик отправлен — откройте чат для переписки.");
      openRequestChat(navigate, req.id);
    } catch (err) {
      console.error("Bid failed:", err);
      toast.error(formatSupabaseError(err, "Ошибка при отправке отклика"));
    }
  };

  const handleStatusChange = async (tenderId: string, status: TenderStatus) => {
    try {
      await updateTender.mutateAsync({ id: tenderId, status });
      toast.success("Статус тендера обновлён");
    } catch {
      toast.error("Не удалось изменить статус");
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

      <div className="container px-4 py-8">
        <StaffBrowsingBanner />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Тендеры</h1>
            <p className="text-lg text-muted-foreground">
              {isLoading
                ? "Загрузка..."
                : `${filteredTenders.length} из ${tenders?.length || 0} тендеров (с учётом фильтров)`}
            </p>
          </div>

          {!user ? (
            <Button asChild className="rounded-xl font-semibold">
              <Link to={authPath(returnTo)}>Войти, чтобы создать тендер</Link>
            </Button>
          ) : caps.canCreateTender() ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl font-semibold gap-2">
                  <Plus className="h-4 w-4" />
                  Создать тендер
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Новый тендер</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tender-title">Название</Label>
                    <Input
                      id="tender-title"
                      placeholder="Например: Строительство дома"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tender-desc">Описание</Label>
                    <Textarea
                      id="tender-desc"
                      placeholder="Подробное описание работ..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Тип задачи</Label>
                    <Select value={tenderType} onValueChange={(v) => setTenderType(v as TenderTypeValue)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        {TENDER_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Город выполнения работ</Label>
                    <Select value={tenderCity} onValueChange={setTenderCity} required>
                      <SelectTrigger id="tender-city">
                        <SelectValue placeholder="Выберите город" />
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
                      <Label htmlFor="tender-budget">Бюджет (₸)</Label>
                      <Input
                        id="tender-budget"
                        type="number"
                        placeholder="5 000 000"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tender-deadline">Дедлайн</Label>
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
                    {createTender.isPending ? "Создание..." : "Опубликовать тендер"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>

        {!isLoading && recommendedTenders.length > 0 && (
          <RecommendedTendersSection tenders={recommendedTenders} />
        )}

        <MarketplaceFilterLayout filterContent={filterFields}>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <Input
              placeholder="Поиск по названию, описанию или городу..."
              className="max-w-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Tabs value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
              <TabsList>
                <TabsTrigger value="for_you">Для вас</TabsTrigger>
                <TabsTrigger value="rating">По дате</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

        {isError ? (
          <QueryErrorBlock error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <TenderSkeleton key={i} />
            ))}
          </div>
        ) : tenders?.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">Тендеров пока нет</p>
            <p className="text-sm text-muted-foreground">
              Создайте первый тендер, чтобы найти исполнителя или поставщика
            </p>
          </div>
        ) : tenders && tenders.length > 0 && filteredTenders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-2">Ничего не найдено</p>
            <p className="text-sm text-muted-foreground mb-4">Попробуйте изменить фильтры или поиск</p>
            <Button variant="outline" onClick={handleResetFilters}>
              Сбросить фильтры
            </Button>
          </div>
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
                onBid={handleBid}
                bidPending={createRequest.isPending}
                onStatusChange={handleStatusChange}
                statusUpdatePending={updateTender.isPending}
              />
            ))}
          </div>
        ) : null}
        </MarketplaceFilterLayout>
      </div>
    </div>
  );
};

export default Tenders;

