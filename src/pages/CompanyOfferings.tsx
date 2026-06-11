import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Package, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHero, PageContent, EmptyState } from "@/components/layout/PageHero";
import { MarketplaceFilterLayout } from "@/components/MarketplaceFilterLayout";
import { CompanyLogo } from "@/components/CompanyLogo";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { PriceInsightBadge } from "@/components/PriceInsightBadge";
import { useCompany } from "@/hooks/useCompanies";
import { useCompanyVitrineListings, type Service } from "@/hooks/useServices";
import { useListingPriceInsights } from "@/hooks/useListingPriceInsights";
import { useAuth } from "@/contexts/AuthContext";
import { useCapabilities } from "@/hooks/useCapabilities";
import { useCreateRequest } from "@/hooks/useRequests";
import { buildRequestSource } from "@/lib/requestSource";
import { openRequestChat } from "@/lib/openRequestChat";
import { authPath } from "@/lib/authRedirect";
import { PRICE_UNIT_LABELS } from "@/lib/priceInsight";
import { toast } from "sonner";
import { useTrackUserEvent } from "@/hooks/useUserEvents";

type LocationState = { from?: string };

const formatPrice = (price: number, unit?: string | null) => {
  const base = new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(price);
  if (unit && unit in PRICE_UNIT_LABELS) {
    return `${base}${PRICE_UNIT_LABELS[unit as keyof typeof PRICE_UNIT_LABELS].replace("₸", "")}`;
  }
  return base;
};

const ListingSkeleton = () => (
  <Card className="border-2 border-transparent">
    <CardContent className="p-6">
      <Skeleton className="h-6 w-3/4 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

const CompanyOfferings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  const backTarget = (location.state as LocationState | null)?.from;
  const { user, profile } = useAuth();
  const caps = useCapabilities();
  const createRequest = useCreateRequest();
  const { track } = useTrackUserEvent();

  const { data: company, isLoading: companyLoading, isError: companyError, error: companyErr, refetch: refetchCompany } =
    useCompany(id);
  const { data: vitrine, isLoading: vitrineLoading, isError: vitrineError, error: vitrineErr, refetch: refetchVitrine } =
    useCompanyVitrineListings(id);

  const materials = vitrine?.materials ?? [];
  const services = vitrine?.services ?? [];
  const materialIds = useMemo(() => materials.map((m) => m.id), [materials]);
  const { data: priceInsights = {} } = useListingPriceInsights(materialIds);

  const [tab, setTab] = useState<"materials" | "services">("materials");
  const [materialGroupFilter, setMaterialGroupFilter] = useState("all");
  const [materialNameFilter, setMaterialNameFilter] = useState("all");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("all");

  const isLoading = companyLoading || vitrineLoading;
  const isError = companyError || vitrineError;
  const error = companyErr || vitrineErr;

  const materialGroupOptions = useMemo(() => {
    const groups = new Set(materials.map((m) => m.material_group || "Прочее"));
    return [...groups].sort((a, b) => a.localeCompare(b, "ru"));
  }, [materials]);

  const materialNameOptions = useMemo(() => {
    return materials
      .filter((m) => materialGroupFilter === "all" || (m.material_group || "Прочее") === materialGroupFilter)
      .map((m) => m.title)
      .filter((name, i, arr) => arr.indexOf(name) === i)
      .sort((a, b) => a.localeCompare(b, "ru"));
  }, [materials, materialGroupFilter]);

  const serviceCategoryOptions = useMemo(() => {
    const cats = new Set(services.map((s) => s.category));
    return [...cats].sort((a, b) => a.localeCompare(b, "ru"));
  }, [services]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const group = m.material_group || "Прочее";
      if (materialGroupFilter !== "all" && group !== materialGroupFilter) return false;
      if (materialNameFilter !== "all" && m.title !== materialNameFilter) return false;
      return true;
    });
  }, [materials, materialGroupFilter, materialNameFilter]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (serviceCategoryFilter !== "all" && s.category !== serviceCategoryFilter) return false;
      return true;
    });
  }, [services, serviceCategoryFilter]);

  const handleBack = () => {
    if (backTarget) {
      navigate(backTarget);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/materials");
    }
  };

  const resetMaterialFilters = () => {
    setMaterialGroupFilter("all");
    setMaterialNameFilter("all");
  };

  const resetServiceFilters = () => {
    setServiceCategoryFilter("all");
  };

  const handleOrderMaterial = async (material: Service) => {
    if (!user || !profile) {
      toast.error("Войдите, чтобы сделать заказ");
      navigate(authPath(returnTo));
      return;
    }
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const msg = `Заинтересован в материале "${material.title}" по цене ${formatPrice(material.price, material.price_unit)}`;
      const req = await createRequest.mutateAsync({
        company_id: material.company_id,
        title: `Заказ материала: ${material.title}`,
        description: msg,
        initial_message: msg,
        source: buildRequestSource({
          kind: "material",
          detail: `«${material.title}»`,
          url: `${origin}/company/${id}/offerings`,
        }),
      });
      toast.success("Запрос отправлен — откройте чат для переписки.");
      openRequestChat(navigate, req.id);
      track("order_material", "material", material.id, {
        material_group: material.material_group || "Прочее",
        city: company?.city,
        company_id: material.company_id,
      });
    } catch {
      toast.error("Ошибка при отправке запроса");
    }
  };

  const handleOrderService = async (service: Service) => {
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
          url: `${origin}/company/${id}/offerings`,
        }),
      });
      toast.success("Запрос отправлен — откройте чат для переписки.");
      openRequestChat(navigate, req.id);
    } catch {
      toast.error("Ошибка при отправке запроса");
    }
  };

  const materialFilterFields = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Категория материала</label>
        <Select
          value={materialGroupFilter}
          onValueChange={(v) => {
            setMaterialGroupFilter(v);
            setMaterialNameFilter("all");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {materialGroupOptions.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Наименование</label>
        <Select value={materialNameFilter} onValueChange={setMaterialNameFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Материал" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all">Все наименования</SelectItem>
            {materialNameOptions.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" className="w-full" onClick={resetMaterialFilters}>
        Сбросить фильтры
      </Button>
    </div>
  );

  const serviceFilterFields = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Категория услуги</label>
        <Select value={serviceCategoryFilter} onValueChange={setServiceCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {serviceCategoryOptions.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" className="w-full" onClick={resetServiceFilters}>
        Сбросить фильтры
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero eyebrow="Витрина" title="Загрузка…" compact />
        <PageContent className="border-b-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <ListingSkeleton key={i} />
            ))}
          </div>
        </PageContent>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero eyebrow="Витрина" title="Ошибка загрузки" compact />
        <PageContent className="border-b-0">
          <QueryErrorBlock
            title="Не удалось загрузить витрину"
            error={error}
            onRetry={() => {
              refetchCompany();
              refetchVitrine();
            }}
          />
        </PageContent>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PageHero eyebrow="Витрина" title="Компания не найдена" compact />
        <PageContent className="border-b-0">
          <div className="text-center py-8">
            <Button asChild className="rounded-xl">
              <Link to="/catalog">Вернуться в каталог</Link>
            </Button>
          </div>
        </PageContent>
      </div>
    );
  }

  const totalCount = materials.length + services.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageHero
        eyebrow="Витрина"
        eyebrowIcon={Building2}
        media={<CompanyLogo name={company.name} logoUrl={company.logo_url} size="md" />}
        title={company.name}
        description={
          totalCount > 0
            ? `${materials.length} материалов · ${services.length} услуг`
            : "Пока нет опубликованных позиций на маркетплейсе"
        }
        compact
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <Button variant="ghost" asChild className="rounded-xl">
              <Link to={`/company/${id}`} state={{ from: returnTo }}>
                <Building2 className="h-4 w-4 mr-2" />
                Профиль компании
              </Link>
            </Button>
          </div>
        }
      />

      <PageContent>
        {totalCount === 0 ? (
          <EmptyState
            icon={Package}
            title="Витрина пуста"
            description="Компания ещё не опубликовала материалы и услуги на маркетплейсе"
            action={
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" className="rounded-xl" onClick={handleBack}>
                  Назад
                </Button>
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to={`/company/${id}`}>Профиль компании</Link>
                </Button>
              </div>
            }
          />
        ) : (
          <MarketplaceFilterLayout filterContent={tab === "materials" ? materialFilterFields : serviceFilterFields}>
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as "materials" | "services");
                resetMaterialFilters();
                resetServiceFilters();
              }}
            >
              <TabsList className="mb-6 rounded-xl">
                <TabsTrigger value="materials" className="rounded-lg gap-2">
                  <Package className="h-4 w-4" />
                  Материалы ({materials.length})
                </TabsTrigger>
                <TabsTrigger value="services" className="rounded-lg gap-2">
                  <Wrench className="h-4 w-4" />
                  Услуги ({services.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="materials">
                {materials.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="Материалов нет"
                    description="Компания не продаёт материалы на маркетплейсе"
                  />
                ) : filteredMaterials.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="Ничего не найдено"
                    description="Попробуйте изменить фильтры"
                    action={
                      <Button variant="outline" className="rounded-xl" onClick={resetMaterialFilters}>
                        Сбросить фильтры
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredMaterials.map((material) => (
                      <Card
                        key={material.id}
                        className="group hover-lift border-2 border-transparent hover:border-primary/20 transition-all duration-300"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="secondary" className="rounded-lg font-semibold shadow-sm">
                              {material.material_group || "Прочее"}
                            </Badge>
                            <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg">
                              <span className="font-semibold text-sm text-primary">
                                {formatPrice(material.price, material.price_unit)}
                              </span>
                            </div>
                          </div>
                          <h3 className="font-bold text-lg mb-1.5 mt-3 group-hover:text-primary transition-colors line-clamp-1">
                            {material.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {material.description}
                          </p>
                          <PriceInsightBadge insight={priceInsights[material.id]} className="mb-4" />
                          {company.city ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4 pt-3 border-t">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{company.city}</span>
                            </div>
                          ) : null}
                          {!user ? (
                            <Button asChild className="w-full rounded-xl shadow-sm">
                              <Link to={authPath(returnTo)}>Войти, чтобы купить</Link>
                            </Button>
                          ) : caps.canBuyListing(material.company_id) ? (
                            <Button
                              className="w-full rounded-xl shadow-sm"
                              onClick={() => handleOrderMaterial(material)}
                              disabled={createRequest.isPending}
                            >
                              Купить товар
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="services">
                {services.length === 0 ? (
                  <EmptyState
                    icon={Wrench}
                    title="Услуг нет"
                    description="Компания не опубликовала услуги на маркетплейсе"
                  />
                ) : filteredServices.length === 0 ? (
                  <EmptyState
                    icon={Wrench}
                    title="Ничего не найдено"
                    description="Попробуйте изменить фильтры"
                    action={
                      <Button variant="outline" className="rounded-xl" onClick={resetServiceFilters}>
                        Сбросить фильтры
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredServices.map((service) => (
                      <Card
                        key={service.id}
                        className="group hover-lift border-2 border-transparent hover:border-primary/20 transition-all duration-300"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <Badge className="rounded-lg font-semibold shadow-sm">{service.category}</Badge>
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
                          {company.city ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4 pt-3 border-t">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{company.city}</span>
                            </div>
                          ) : null}
                          {!user ? (
                            <Button asChild className="w-full rounded-xl" variant="outline">
                              <Link to={authPath(returnTo)}>Войти, чтобы заказать</Link>
                            </Button>
                          ) : caps.canBuyListing(service.company_id) ? (
                            <Button
                              className="w-full rounded-xl"
                              variant="outline"
                              onClick={() => handleOrderService(service)}
                              disabled={createRequest.isPending}
                            >
                              Заказать услугу
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </MarketplaceFilterLayout>
        )}
      </PageContent>
    </div>
  );
};

export default CompanyOfferings;
