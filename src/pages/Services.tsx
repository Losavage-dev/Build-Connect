import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
import { PageHero, PageContent, EmptyState } from "@/components/layout/PageHero";
import { useCatalogLabel } from "@/lib/i18nCatalog";
import { useAppFormat } from "@/hooks/useAppFormat";

const Services = () => {
  const { t } = useTranslation(["marketplace", "common"]);
  const catalogLabel = useCatalogLabel();
  const { formatCurrency, compareStrings } = useAppFormat();
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
  const [companyFilter, setCompanyFilter] = useState<string>(searchParams.get("company") || "all");
  const [search, setSearch] = useState<string>(searchParams.get("search") || "");

  useEffect(() => {
    setCity(searchParams.get("city") || "all");
    setCatFilter(searchParams.get("category") || "all");
    setCompanyFilter(searchParams.get("company") || "all");
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  const companyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of services || []) {
      if (s.company_id && s.company_name) map.set(s.company_id, s.company_name);
    }
    return [...map.entries()].sort((a, b) => compareStrings(a[1], b[1]));
  }, [services, compareStrings]);

  useEffect(() => {
    const listingId = searchParams.get("listing");
    if (!listingId || !services?.length) return;
    const el = document.getElementById(`service-listing-${listingId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    const timer = window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [searchParams, services]);

  const filteredServices = useMemo(() => {
    if (!services?.length) return [];
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (city !== "all" && (s.company_city || "") !== city) return false;
      if (catFilter !== "all" && s.category !== catFilter) return false;
      if (companyFilter !== "all" && s.company_id !== companyFilter) return false;
      if (!q) return true;
      const blob = `${s.title} ${s.description} ${s.company_name || ""} ${s.category}`.toLowerCase();
      return blob.includes(q);
    });
  }, [services, city, catFilter, companyFilter, search]);

  const canCreate = caps.canPublishListing();

  const handleResetFilters = () => {
    setCity("all");
    setCatFilter("all");
    setCompanyFilter("all");
    setSearch("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("city");
      next.delete("category");
      next.delete("company");
      next.delete("search");
      return next;
    });
  };

  const filterFields = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">{t("common:city")}</label>
        <Select value={city} onValueChange={setCity}>
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
      <div>
        <label className="text-sm font-medium mb-2 block">{t("common:category")}</label>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t("common:category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common:allCategories")}</SelectItem>
            {SERVICE_VITRINE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {catalogLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">{t("filters.company")}</label>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t("filters.company")} />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all">{t("services.allCompanies")}</SelectItem>
            {companyOptions.map(([cid, name]) => (
              <SelectItem key={cid} value={cid}>
                {name}
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
    if (!companyId) {
      toast.error(t("materials.selectCompany"));
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
      toast.success(t("services.createSuccess"));
      setOpen(false);
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setCompanyId("");
    } catch {
      toast.error(t("services.createError"));
    }
  };

  const handleOrder = async (service: { id: string; title: string; price: number; company_id: string }) => {
    if (!user || !profile) {
      toast.error(t("common:loginToOrder"));
      navigate(authPath(returnTo));
      return;
    }

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const msg = t("marketplace:orders.serviceMsg", { title: service.title, price: formatCurrency(service.price) });
      const req = await createRequest.mutateAsync({
        company_id: service.company_id,
        title: t("marketplace:orders.serviceTitle", { title: service.title }),
        description: msg,
        initial_message: msg,
        source: buildRequestSource({
          kind: "service",
          detail: `«${service.title}»`,
          url: `${origin}/services?listing=${encodeURIComponent(service.id)}`,
        }),
      });
      toast.success(t("services.orderSuccess"));
      openRequestChat(navigate, req.id);
    } catch {
      toast.error(t("services.orderError"));
    }
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

      <PageHero
        eyebrow={t("services.eyebrow")}
        eyebrowIcon={Wrench}
        title={t("services.title")}
        description={
          isLoading
            ? t("common:loading")
            : t("services.found", {
                filtered: filteredServices.length,
                total: services?.length || 0,
              })
        }
        compact
        actions={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl btn-glow font-semibold gap-2">
                  <Plus className="h-4 w-4" />
                  {t("services.addService")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle>{t("services.newService")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("materials.company")}</Label>
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("materials.selectCompany")} />
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
                    <Label htmlFor="svc-title">{t("services.serviceTitle")}</Label>
                    <Input
                      id="svc-title"
                      placeholder={t("services.titlePlaceholder")}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="svc-desc">{t("materials.description")}</Label>
                    <Textarea
                      id="svc-desc"
                      placeholder={t("services.descPlaceholder")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="svc-price">{t("services.priceLabel")}</Label>
                      <Input
                        id="svc-price"
                        type="number"
                        placeholder={t("services.pricePlaceholder")}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("common:category")}</Label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger>
                          <SelectValue placeholder={t("services.selectPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_VITRINE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {catalogLabel(cat)}
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
                    {createService.isPending ? t("common:creating") : t("services.publishService")}
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
          <div className="mb-6">
            <Input
              placeholder={t("services.searchPlaceholderFull")}
              className="max-w-md rounded-xl bg-card/80 border-border/60"
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
            <EmptyState
              icon={Wrench}
              title={t("services.emptyTitle")}
              description={t("services.emptyDesc")}
            />
          ) : services && services.length > 0 && filteredServices.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title={t("common:notFound")}
              description={t("common:changeFiltersOrSearch")}
              action={
                <Button variant="outline" className="rounded-xl" onClick={handleResetFilters}>
                  {t("common:resetFilters")}
                </Button>
              }
            />
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
                      {catalogLabel(service.category)}
                    </Badge>
                    <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg">
                      <span className="font-semibold text-sm text-primary">
                        {formatCurrency(service.price)}
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
                      <Link
                        to={`/company/${service.company_id}/offerings`}
                        state={{ from: `${location.pathname}${location.search}` }}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {service.company_name}
                      </Link>
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
                      <Link to={authPath(returnTo)}>{t("services.loginToOrderService")}</Link>
                    </Button>
                  ) : caps.canBuyListing(service.company_id) ? (
                    <Button
                      className="w-full rounded-xl"
                      variant="outline"
                      onClick={() => handleOrder(service)}
                      disabled={createRequest.isPending}
                    >
                      {t("services.orderService")}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
            </div>
          ) : null}
        </MarketplaceFilterLayout>
      </PageContent>
    </div>
  );
};

export default Services;
