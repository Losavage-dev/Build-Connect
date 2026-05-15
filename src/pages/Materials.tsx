import { useState, useEffect, useMemo } from "react";
import { MapPin, Package, Plus } from "lucide-react";
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
import { MarketplaceFilterLayout } from "@/components/MarketplaceFilterLayout";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { StaffBrowsingBanner } from "@/components/StaffBrowsingBanner";
import { KAZAKHSTAN_CITIES, MATERIAL_CATALOG, MATERIAL_GROUP_NAMES } from "@/lib/constants";

const CUSTOM_MATERIAL_VALUE = "__custom__";

const Materials = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const returnTo = `${location.pathname}${location.search}`;
  const { user, profile } = useAuth();
  const caps = useCapabilities();
  const { data: materials, isLoading, isError, error, refetch } = useServices("Материалы");
  const { data: myCompanies } = useMyCompanies(profile?.id);
  const createMaterial = useCreateService();
  const createRequest = useCreateRequest();

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
  const [search, setSearch] = useState<string>(searchParams.get("search") || "");

  useEffect(() => {
    setCity(searchParams.get("city") || "all");
    setGroupFilter(searchParams.get("group") || "all");
    setNameFilter(searchParams.get("name") || "all");
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  const nameOptionsForFilter = useMemo(() => {
    const fromCatalog =
      groupFilter === "all"
        ? Object.values(MATERIAL_CATALOG).flat()
        : MATERIAL_CATALOG[groupFilter] || [];
    const fromDb = (materials || [])
      .filter((m) => groupFilter === "all" || (m.material_group || "Прочее") === groupFilter)
      .map((m) => m.title);
    return [...new Set([...fromCatalog, ...fromDb])].sort((a, b) => a.localeCompare(b, "ru"));
  }, [groupFilter, materials]);

  const nameOptionsForCreate = materialGroup ? MATERIAL_CATALOG[materialGroup] || [] : [];

  useEffect(() => {
    const listingId = searchParams.get("listing");
    if (!listingId || !materials?.length) return;
    const el = document.getElementById(`material-listing-${listingId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    const t = window.setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
    }, 2600);
    return () => window.clearTimeout(t);
  }, [searchParams, materials]);

  const filteredMaterials = useMemo(() => {
    if (!materials?.length) return [];
    const q = search.trim().toLowerCase();
    return materials.filter((m) => {
      if (city !== "all" && (m.company_city || "") !== city) return false;
      const group = m.material_group || "Прочее";
      if (groupFilter !== "all" && group !== groupFilter) return false;
      if (nameFilter !== "all" && m.title !== nameFilter) return false;
      if (!q) return true;
      const blob = `${m.title} ${m.material_group || ""} ${m.description} ${m.company_name || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [materials, city, groupFilter, nameFilter, search]);

  const canCreate = caps.canPublishListing();

  const handleResetFilters = () => {
    setCity("all");
    setGroupFilter("all");
    setNameFilter("all");
    setSearch("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("city");
      next.delete("group");
      next.delete("name");
      next.delete("search");
      return next;
    });
  };

  const filterFields = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Категория материала</label>
        <Select
          value={groupFilter}
          onValueChange={(v) => {
            setGroupFilter(v);
            setNameFilter("all");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {MATERIAL_GROUP_NAMES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
            <SelectItem value="Прочее">Прочее</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Наименование</label>
        <Select value={nameFilter} onValueChange={setNameFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Материал" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all">Все наименования</SelectItem>
            {nameOptionsForFilter.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
    if (!materialGroup) {
      toast.error("Выберите категорию материала");
      return;
    }
    const resolvedTitle =
      materialName === CUSTOM_MATERIAL_VALUE ? customTitle.trim() : materialName;
    if (!resolvedTitle) {
      toast.error("Укажите наименование материала");
      return;
    }
    try {
      await createMaterial.mutateAsync({
        company_id: companyId,
        title: resolvedTitle,
        description,
        price: Number(price),
        category: "Материалы",
        material_group: materialGroup,
      });
      toast.success("Товар успешно добавлен!");
      setOpen(false);
      setMaterialGroup("");
      setMaterialName("");
      setCustomTitle("");
      setDescription("");
      setPrice("");
      setCompanyId("");
    } catch {
      toast.error("Ошибка при добавлении товара");
    }
  };

  const handleOrder = async (material: any) => {
    if (!user || !profile) {
      toast.error("Войдите, чтобы сделать заказ");
      navigate(authPath(returnTo));
      return;
    }

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const msg = `Заинтересован в покупке "${material.title}" по цене ${formatPrice(material.price)}`;
      const req = await createRequest.mutateAsync({
        company_id: material.company_id,
        title: `Заказ материала: ${material.title}`,
        description: msg,
        initial_message: msg,
        source: buildRequestSource({
          kind: "material",
          detail: `«${material.title}»`,
          url: `${origin}/materials?listing=${encodeURIComponent(material.id)}`,
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

      <div className="container px-4 py-8">
        <StaffBrowsingBanner />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Каталог материалов</h1>
            <p className="text-lg text-muted-foreground">
              {isLoading
                ? "Загрузка..."
                : `${filteredMaterials.length} из ${materials?.length || 0} товаров (с учётом фильтров)`}
            </p>
          </div>

          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl btn-glow font-semibold gap-2">
                  <Plus className="h-4 w-4" />
                  Выставить товар
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Новый товар</DialogTitle>
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
                    <Label>Категория материала</Label>
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
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_GROUP_NAMES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Наименование</Label>
                    <Select
                      value={materialName}
                      onValueChange={setMaterialName}
                      disabled={!materialGroup}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={materialGroup ? "Выберите материал" : "Сначала категория"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {nameOptionsForCreate.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                        <SelectItem value={CUSTOM_MATERIAL_VALUE}>Другое (своё название)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {materialName === CUSTOM_MATERIAL_VALUE ? (
                    <div className="space-y-2">
                      <Label htmlFor="mat-custom-title">Своё наименование</Label>
                      <Input
                        id="mat-custom-title"
                        placeholder="Например: Арматура 12 мм, бухта"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        required
                      />
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="mat-desc">Описание</Label>
                    <Textarea
                      id="mat-desc"
                      placeholder="Характеристики, размеры, наличие..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mat-price">Цена (₸)</Label>
                    <Input
                      id="mat-price"
                      type="number"
                      placeholder="120000"
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
                    {createMaterial.isPending ? "Добавление..." : "Опубликовать товар"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <MarketplaceFilterLayout filterContent={filterFields}>
          <div className="mb-6">
            <Input
              placeholder="Поиск по названию, описанию, компании..."
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
                <MaterialSkeleton key={i} />
              ))}
            </div>
          ) : materials?.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">Товаров пока нет</p>
              <p className="text-sm text-muted-foreground">
                Поставщики ещё не выставили товары в эту категорию
              </p>
            </div>
          ) : materials && materials.length > 0 && filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">Ничего не найдено</p>
              <p className="text-sm text-muted-foreground mb-4">Попробуйте изменить фильтры или поиск</p>
              <Button variant="outline" onClick={handleResetFilters}>
                Сбросить фильтры
              </Button>
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <Card
                key={material.id}
                id={`material-listing-${material.id}`}
                className="group hover-lift border-2 border-transparent hover:border-primary/20 transition-all duration-300 scroll-mt-24"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="rounded-lg font-semibold shadow-sm">
                      {material.material_group || "Прочее"}
                    </Badge>
                    <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg">
                      <span className="font-semibold text-sm text-primary">
                        {formatPrice(material.price)}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg mb-1.5 mt-3 group-hover:text-primary transition-colors line-clamp-1">
                    {material.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {material.description}
                  </p>

                  {material.company_name && (
                    <div className="flex items-center gap-3 pt-3 border-t text-sm text-muted-foreground mb-4">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{material.company_name}</span>
                      {material.company_city && (
                        <div className="flex items-center gap-1 ml-auto">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{material.company_city}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!user ? (
                    <Button asChild className="w-full rounded-xl shadow-sm">
                      <Link to={authPath(returnTo)}>Войти, чтобы купить</Link>
                    </Button>
                  ) : caps.canBuyListing(material.company_id) ? (
                    <Button
                      className="w-full rounded-xl shadow-sm"
                      onClick={() => handleOrder(material)}
                      disabled={createRequest.isPending}
                    >
                      Купить товар
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

export default Materials;

