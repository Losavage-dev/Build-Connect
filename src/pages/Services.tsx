import { useState, useEffect, useMemo } from "react";
import { MapPin, Wrench, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useCapabilities } from "@/hooks/useCapabilities";
import { useServices, useMyCompanies, useCreateService } from "@/hooks/useServices";
import { useCreateRequest } from "@/hooks/useRequests";
import { buildRequestSource } from "@/lib/requestSource";
import { openRequestChat } from "@/lib/openRequestChat";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authPath } from "@/lib/authRedirect";
import { toast } from "sonner";
import { SERVICE_VITRINE_CATEGORIES, KAZAKHSTAN_CITIES } from "@/lib/constants";
import { MarketplaceFilterLayout } from "@/components/MarketplaceFilterLayout";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { StaffBrowsingBanner } from "@/components/StaffBrowsingBanner";

const Services = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const returnTo = `${location.pathname}${location.search}`;
  const { user, profile } = useAuth();
  const caps = useCapabilities();
  const { data: services, isLoading, isError, error, refetch } = useServices(undefined, "Материалы");
  const { data: myCompanies } = useMyCompanies(profile?.id);
  const createService = useCreateService();
  const createRequest = useCreateRequest();

  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  const [city, setCity] = useState<string>(searchParams.get("city") || "all");
  const [catFilter, setCatFilter] = useState<string>(searchParams.get("category") || "all");
  const [search, setSearch] = useState<string>(searchParams.get("search") || "");

  useEffect(() => {
    setCity(searchParams.get("city") || "all");
    setCatFilter(searchParams.get("category") || "all");
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const listingId = searchParams.get("listing");
    if (!listingId || !services?.length) return;
    const el = document.getElementById(`service-listing-${listingId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    const t = window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    }, 2600);
    return () => window.clearTimeout(t);
  }, [searchParams, services]);

  const filteredServices = useMemo(() => {
    if (!services?.length) return [];
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (city !== "all" && (s.company_city || "") !== city) return false;
      if (catFilter !== "all" && s.category !== catFilter) return false;
      if (!q) return true;
      const blob = `${s.title} ${s.description} ${s.company_name || ""} ${s.category}`.toLowerCase();
      return blob.includes(q);
    });
  }, [services, city, catFilter, search]);

  const canCreate = caps.canPublishListing();

  const handleResetFilters = () => {
    setCity("all");
    setCatFilter("all");
    setSearch("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("city");
      next.delete("category");
      next.delete("search");
      return next;
    });
  };

  const filterFields = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Город</label>
        <Select value={city} onValueChange={setCity}>
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
      <div>
        <label className="text-sm font-medium mb-2 block">Категория</label>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {SERVICE_VITRINE_CATEGORIES.map((c) => (
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
    if (!companyId) {
      toast.error("Выберите компанию");
      return;
    }
    try {
      await createService.mutateAsync({
        company_id: companyId,
        title,
        description,
        price: Number(price),
        category,
      });
      toast.success("Услуга успешно добавлена!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setCompanyId("");
    } catch {
      toast.error("Ошибка при создании услуги");
    }
  };

  const handleOrder = async (service: any) => {
    if (!user || !profile) {
      toast.error("Войдите, чтобы сделать заказ");
      navigate(authPath(returnTo));
      return;
    }

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const msg = `Заинтересован в услуге "${service.title}" по цене ${formatPrice(service.price)}`;
      const req = await createRequest.mutateAsync({
        company_id: service.company_id,
        title: `Заказ услуги: ${service.title}`,
        description: msg,
        initial_message: msg,
        source: buildRequestSource({
          kind: "service",
          detail: `«${service.title}»`,
          url: `${origin}/services?listing=${encodeURIComponent(service.id)}`,
        }),
      });
      toast.success("Запрос отправлен — откройте чат для переписки.");
      openRequestChat(navigate, req.id);
    } catch {
      toast.error("Ошибка при отправке запроса");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-KZ", {
      style: "currency",
      currency: "KZT",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const ServiceSkeleton = () => (
    <Card className="border-2 border-transparent">
      <CardContent className="p-6">
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Каталог услуг</h1>
            <p className="text-lg text-muted-foreground">
              {isLoading
                ? "Загрузка..."
                : `${filteredServices.length} из ${services?.length || 0} услуг (без категории «Материалы», с учётом фильтров)`}
            </p>
          </div>

          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl btn-glow font-semibold gap-2">
                  <Plus className="h-4 w-4" />
                  Добавить услугу
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Новая услуга</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Компания</Label>
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите компанию" />
                      </SelectTrigger>
                      <SelectContent>
                        {myCompanies?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="svc-title">Название услуги</Label>
                    <Input
                      id="svc-title"
                      placeholder="Например: Кладка газоблока"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="svc-desc">Описание</Label>
                    <Textarea
                      id="svc-desc"
                      placeholder="Подробное описание услуги..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="svc-price">Цена (₸)</Label>
                      <Input
                        id="svc-price"
                        type="number"
                        placeholder="8000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Категория</Label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_VITRINE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-xl"
                    disabled={createService.isPending}
                  >
                    {createService.isPending ? "Создание..." : "Опубликовать услугу"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <MarketplaceFilterLayout filterContent={filterFields}>
          <div className="mb-6">
            <Input
              placeholder="Поиск по названию, описанию, компании, категории..."
              className="max-w-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isError ? (
            <QueryErrorBlock error={error} onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ServiceSkeleton key={i} />
              ))}
            </div>
          ) : services?.length === 0 ? (
            <div className="text-center py-16">
              <Wrench className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">Услуг пока нет</p>
              <p className="text-sm text-muted-foreground">
                Подрядчики ещё не опубликовали свои услуги
              </p>
            </div>
          ) : services && services.length > 0 && filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">Ничего не найдено</p>
              <p className="text-sm text-muted-foreground mb-4">Попробуйте изменить фильтры или поиск</p>
              <Button variant="outline" onClick={handleResetFilters}>
                Сбросить фильтры
              </Button>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                id={`service-listing-${service.id}`}
                className="group hover-lift border-2 border-transparent hover:border-primary/20 transition-all duration-300 scroll-mt-24"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className="rounded-lg font-semibold shadow-sm">
                      {service.category}
                    </Badge>
                    <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg">
                      <span className="font-semibold text-sm text-primary">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-1.5 mt-3 group-hover:text-primary transition-colors line-clamp-1">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  {service.company_name && (
                    <div className="flex items-center gap-3 pt-3 border-t text-sm text-muted-foreground mb-4">
                      <Wrench className="h-4 w-4" />
                      <span className="font-medium">{service.company_name}</span>
                      {service.company_city && (
                        <div className="flex items-center gap-1 ml-auto">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{service.company_city}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!user ? (
                    <Button asChild className="w-full rounded-xl" variant="outline">
                      <Link to={authPath(returnTo)}>Войти, чтобы заказать</Link>
                    </Button>
                  ) : caps.canBuyListing(service.company_id) ? (
                    <Button
                      className="w-full rounded-xl"
                      variant="outline"
                      onClick={() => handleOrder(service)}
                      disabled={createRequest.isPending}
                    >
                      Заказать услугу
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
            </div>
          ) : null}
        </MarketplaceFilterLayout>
      </div>
    </div>
  );
};

export default Services;
