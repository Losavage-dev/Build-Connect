import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import { MaterialListingCard } from "@/components/MaterialListingCard";
import { RecommendedMaterialsSection } from "@/components/RecommendedMaterialsSection";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRecommendedMaterials, useSortedMaterials } from "@/hooks/useRecommendations";
import { useTrackUserEvent } from "@/hooks/useUserEvents";
import type { SortMode } from "@/lib/recommendations";
import { useAuth } from "@/contexts/AuthContext";
import { useCapabilities } from "@/hooks/useCapabilities";
import { useServices, useMyCompanies, useCreateService } from "@/hooks/useServices";
import { useCreateRequest } from "@/hooks/useRequests";
import { buildRequestSource } from "@/lib/requestSource";
import { openRequestChat } from "@/lib/openRequestChat";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authPath } from "@/lib/authRedirect";
import { toast } from "sonner";
import { MarketplaceFilterLayout } from "@/components/MarketplaceFilterLayout";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { StaffBrowsingBanner } from "@/components/StaffBrowsingBanner";
import { PageHero, PageContent, EmptyState } from "@/components/layout/PageHero";
import { KAZAKHSTAN_CITIES, MATERIAL_CATALOG, MATERIAL_GROUP_NAMES } from "@/lib/constants";
import { useMarketProducts, findMarketProductByName } from "@/hooks/useMarketProducts";
import { useListingPriceInsights } from "@/hooks/useListingPriceInsights";
import { useCatalogLabel } from "@/lib/i18nCatalog";
import { useAppFormat } from "@/hooks/useAppFormat";

const CUSTOM_MATERIAL_VALUE = "__custom__";
const OTHER_GROUP = "Прочее";

const Materials = () => {
  const { t } = useTranslation(["marketplace", "common"]);
  const catalogLabel = useCatalogLabel();
  const { formatCurrency, compareStrings } = useAppFormat();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const returnTo = `${location.pathname}${location.search}`;
  const { user, profile } = useAuth();
  const caps = useCapabilities();
  const { data: materials, isLoading, isError, error, refetch } = useServices("Материалы");
  const { data: marketProducts } = useMarketProducts();
  const materialIds = useMemo(() => (materials || []).map((m) => m.id), [materials]);
  const { data: priceInsights = {} } = useListingPriceInsights(materialIds);
  const { data: myCompanies } = useMyCompanies(profile?.id);
  const createMaterial = useCreateService();
  const createRequest = useCreateRequest();
  const { track } = useTrackUserEvent();

  const sortParam = searchParams.get("sort");
  const [sortMode, setSortMode] = useState<SortMode>(sortParam === "for_you" ? "for_you" : "rating");

  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [materialGroup, setMaterialGroup] = useState("");
  const [materialName, setMaterialName] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [city, setCity] = useState<string>(searchParams.get("city") || "all");
  const [groupFilter, setGroupFilter] = useState<string>(searchParams.get("group") || "all");
  const [nameFilter, setNameFilter] = useState<string>(searchParams.get("name") || "all");
  const [companyFilter, setCompanyFilter] = useState<string>(searchParams.get("company") || "all");
  const [search, setSearch] = useState<string>(searchParams.get("search") || "");

  useEffect(() => {
    setCity(searchParams.get("city") || "all");
    setGroupFilter(searchParams.get("group") || "all");
    setNameFilter(searchParams.get("name") || "all");
    setCompanyFilter(searchParams.get("company") || "all");
    setSearch(searchParams.get("search") ?? "");
    const urlSort = searchParams.get("sort");
    if (urlSort === "for_you") setSortMode("for_you");
    else if (urlSort === "rating" || !urlSort) setSortMode("rating");
  }, [searchParams]);

  const companyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of materials || []) {
      if (m.company_id && m.company_name) map.set(m.company_id, m.company_name);
    }
    return [...map.entries()].sort((a, b) => compareStrings(a[1], b[1]));
  }, [materials, compareStrings]);

  const nameOptionsForFilter = useMemo(() => {
    const fromCatalog =
      groupFilter === "all"
        ? Object.values(MATERIAL_CATALOG).flat()
        : MATERIAL_CATALOG[groupFilter] || [];
    const fromDb = (materials || [])
      .filter((m) => groupFilter === "all" || (m.material_group || OTHER_GROUP) === groupFilter)
      .map((m) => m.title);
    return [...new Set([...fromCatalog, ...fromDb])].sort((a, b) => compareStrings(a, b));
  }, [groupFilter, materials, compareStrings]);

  const nameOptionsForCreate = materialGroup ? MATERIAL_CATALOG[materialGroup] || [] : [];

  useEffect(() => {
    const listingId = searchParams.get("listing");
    if (!listingId || !materials?.length) return;
    const el = document.getElementById(`material-listing-${listingId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    const timer = window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [searchParams, materials]);

  const filteredMaterials = useMemo(() => {
    if (!materials?.length) return [];
    const q = search.trim().toLowerCase();
    return materials.filter((m) => {
      if (city !== "all" && (m.company_city || "") !== city) return false;
      const group = m.material_group || OTHER_GROUP;
      if (groupFilter !== "all" && group !== groupFilter) return false;
      if (nameFilter !== "all" && m.title !== nameFilter) return false;
      if (companyFilter !== "all" && m.company_id !== companyFilter) return false;
      if (!q) return true;
      const blob = `${m.title} ${m.material_group || ""} ${m.description} ${m.company_name || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [materials, city, groupFilter, nameFilter, companyFilter, search]);

  const sortedMaterials = useSortedMaterials(filteredMaterials, sortMode);
  const recommendedMaterials = useRecommendedMaterials(materials, 6);

  const canCreate = caps.canPublishListing();

  const handleResetFilters = () => {
    setCity("all");
    setGroupFilter("all");
    setNameFilter("all");
    setCompanyFilter("all");
    setSearch("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("city");
      next.delete("group");
      next.delete("name");
      next.delete("company");
      next.delete("search");
      return next;
    });
  };

  const filterFields = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">{t("materials.materialCategory")}</label>
        <Select
          value={groupFilter}
          onValueChange={(v) => {
            setGroupFilter(v);
            setNameFilter("all");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("common:category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common:allCategories")}</SelectItem>
            {MATERIAL_GROUP_NAMES.map((g) => (
              <SelectItem key={g} value={g}>
                {catalogLabel(g)}
              </SelectItem>
            ))}
            <SelectItem value={OTHER_GROUP}>{catalogLabel(OTHER_GROUP)}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">{t("materials.materialName")}</label>
        <Select value={nameFilter} onValueChange={setNameFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t("materials.materialName")} />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all">{t("materials.allNames")}</SelectItem>
            {nameOptionsForFilter.map((n) => (
              <SelectItem key={n} value={n}>
                {catalogLabel(n)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">{t("materials.company")}</label>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger>
            <SelectValue placeholder={t("materials.company")} />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all">{t("materials.allCompanies")}</SelectItem>
            {companyOptions.map(([cid, name]) => (
              <SelectItem key={cid} value={cid}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
    if (!materialGroup) {
      toast.error(t("materials.selectMaterialCategory"));
      return;
    }
    const resolvedTitle =
      materialName === CUSTOM_MATERIAL_VALUE ? customTitle.trim() : materialName;
    if (!resolvedTitle) {
      toast.error(t("materials.specifyMaterialName"));
      return;
    }
    try {
      const matchedProduct =
        materialName !== CUSTOM_MATERIAL_VALUE
          ? findMarketProductByName(marketProducts, materialName)
          : findMarketProductByName(marketProducts, customTitle.trim());
      await createMaterial.mutateAsync({
        company_id: companyId,
        title: resolvedTitle,
        description,
        price: Number(price),
        category: "Материалы",
        material_group: materialGroup,
        market_product_id: matchedProduct?.id ?? null,
        price_unit: matchedProduct?.price_unit ?? null,
      });
      toast.success(t("materials.createSuccess"));
      setOpen(false);
      setMaterialGroup("");
      setMaterialName("");
      setCustomTitle("");
      setDescription("");
      setPrice("");
      setCompanyId("");
    } catch {
      toast.error(t("materials.createError"));
    }
  };

  const handleOrder = async (material: {
    id: string;
    title: string;
    price: number;
    company_id: string;
    material_group?: string | null;
    company_city?: string | null;
  }) => {
    if (!user || !profile) {
      toast.error(t("common:loginToOrder"));
      navigate(authPath(returnTo));
      return;
    }

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const msg = t("marketplace:orders.materialMsg", { title: material.title, price: formatCurrency(material.price) });
      const req = await createRequest.mutateAsync({
        company_id: material.company_id,
        title: t("marketplace:orders.materialTitle", { title: material.title }),
        description: msg,
        initial_message: msg,
        source: buildRequestSource({
          kind: "material",
          detail: `«${material.title}»`,
          url: `${origin}/materials?listing=${encodeURIComponent(material.id)}`,
        }),
      });
      toast.success(t("materials.orderSuccess"));
      openRequestChat(navigate, req.id);
      track("order_material", "material", material.id, {
        material_group: material.material_group || OTHER_GROUP,
        city: material.company_city,
        company_id: material.company_id,
      });
    } catch {
      toast.error(t("materials.orderError"));
    }
  };

  const MaterialSkeleton = () => (
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
        eyebrow={t("materials.eyebrow")}
        eyebrowIcon={Package}
        title={t("materials.title")}
        description={
          isLoading
            ? t("common:loading")
            : t("materials.found", {
                filtered: filteredMaterials.length,
                total: materials?.length || 0,
              })
        }
        compact
        actions={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl btn-glow font-semibold gap-2">
                  <Plus className="h-4 w-4" />
                  {t("materials.addProduct")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle>{t("materials.newProduct")}</DialogTitle>
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
                    <Label>{t("materials.materialCategory")}</Label>
                    <Select
                      value={materialGroup}
                      onValueChange={(v) => {
                        setMaterialGroup(v);
                        setMaterialName("");
                        setCustomTitle("");
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("materials.selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_GROUP_NAMES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {catalogLabel(g)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("materials.materialName")}</Label>
                    <Select
                      value={materialName}
                      onValueChange={setMaterialName}
                      disabled={!materialGroup}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            materialGroup
                              ? t("materials.selectMaterial")
                              : t("materials.selectCategoryFirst")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {nameOptionsForCreate.map((n) => (
                          <SelectItem key={n} value={n}>
                            {catalogLabel(n)}
                          </SelectItem>
                        ))}
                        <SelectItem value={CUSTOM_MATERIAL_VALUE}>
                          {t("materials.customName")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {materialName === CUSTOM_MATERIAL_VALUE ? (
                    <div className="space-y-2">
                      <Label htmlFor="mat-custom-title">{t("materials.customNameLabel")}</Label>
                      <Input
                        id="mat-custom-title"
                        placeholder={t("materials.customNamePlaceholder")}
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        required
                      />
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="mat-desc">{t("materials.description")}</Label>
                    <Textarea
                      id="mat-desc"
                      placeholder={t("materials.descriptionPlaceholder")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mat-price">{t("materials.price")}</Label>
                    <Input
                      id="mat-price"
                      type="number"
                      placeholder={t("materials.pricePlaceholder")}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-xl"
                    disabled={createMaterial.isPending}
                  >
                    {createMaterial.isPending ? t("common:adding") : t("materials.publishProduct")}
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
              placeholder={t("materials.searchPlaceholder")}
              className="max-w-md rounded-xl bg-card/80 border-border/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Tabs
              value={sortMode}
              onValueChange={(v) => {
                const mode = v as SortMode;
                setSortMode(mode);
                const next = new URLSearchParams(searchParams);
                if (mode === "for_you") next.set("sort", "for_you");
                else next.delete("sort");
                setSearchParams(next, { replace: true });
              }}
            >
              <TabsList className="rounded-xl">
                <TabsTrigger value="rating">{t("common:sortByDate")}</TabsTrigger>
                <TabsTrigger value="for_you">{t("common:forYou")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {!isLoading && recommendedMaterials.length > 0 && (
            <RecommendedMaterialsSection items={recommendedMaterials} />
          )}

          {isError ? (
            <QueryErrorBlock error={error} onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <MaterialSkeleton key={i} />
              ))}
            </div>
          ) : materials?.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t("materials.emptyTitle")}
              description={t("materials.emptyDesc")}
            />
          ) : materials && materials.length > 0 && filteredMaterials.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t("common:notFound")}
              description={t("common:changeFiltersOrSearch")}
              action={
                <Button variant="outline" className="rounded-xl" onClick={handleResetFilters}>
                  {t("common:resetFilters")}
                </Button>
              }
            />
          ) : filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedMaterials.map((material) => (
              <MaterialListingCard
                key={material.id}
                material={material}
                priceInsight={priceInsights[material.id]}
                returnTo={returnTo}
                user={user}
                canBuy={!!user && caps.canBuyListing(material.company_id)}
                onOrder={handleOrder}
                orderPending={createRequest.isPending}
              />
            ))}
            </div>
          ) : null}
        </MarketplaceFilterLayout>
      </PageContent>
    </div>
  );
};

export default Materials;
