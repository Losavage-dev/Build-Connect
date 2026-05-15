import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, Loader2, Plus, Trash2, Upload, Image as ImageIcon, Clapperboard, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany, useUpdateCompany, useReplaceCompanyCategories } from "@/hooks/useCompanies";
import { useCreateService, useDeleteService } from "@/hooks/useCompanyServices";
import {
  useCreateProject,
  useDeleteProject,
  useAddProjectImage,
  useUpdateProject,
  useDeleteProjectImage,
} from "@/hooks/useProjects";
import { formatDisplayDate } from "@/lib/portfolio";
import { useCreatePromoPost, useDeletePromoPost, useCompanyPromoPosts } from "@/hooks/usePromoFeed";
import { useImageUpload } from "@/hooks/useImageUpload";
import { toast } from "sonner";

import { BUSINESS_CATEGORIES, KAZAKHSTAN_CITIES, SERVICE_VITRINE_CATEGORIES } from "@/lib/constants";
import { parseYouTubeVideoId } from "@/lib/youtube";
import { SearchableMultiCategoryPicker } from "@/components/SearchableMultiCategoryPicker";
import { CompanyVerificationPanel } from "@/components/CompanyVerificationPanel";
import type { CompanyVerificationStatus } from "@/lib/companyVerification";

const categories = BUSINESS_CATEGORIES;
const cities = KAZAKHSTAN_CITIES;

const ManageCompany = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user, profile, isLoading: authLoading } = useAuth();
  const { data: company, isLoading } = useCompany(id);
  const updateCompany = useUpdateCompany();
  const replaceCompanyCategories = useReplaceCompanyCategories();
  const createService = useCreateService();
  const deleteService = useDeleteService();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const addProjectImage = useAddProjectImage();
  const createPromoPost = useCreatePromoPost();
  const deletePromoPost = useDeletePromoPost();
  const { data: promoPosts = [] } = useCompanyPromoPosts(id);
  const { uploadImage, deleteImage, isUploading } = useImageUpload();
  const updateProject = useUpdateProject();
  const deleteProjectImage = useDeleteProjectImage();

  // Company edit state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Service dialog
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePriceFrom, setServicePriceFrom] = useState("");
  const [servicePriceTo, setServicePriceTo] = useState("");
  const [serviceCategory, setServiceCategory] = useState("Другое");

  // Project dialog
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDate, setProjectDate] = useState("");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectPhase, setProjectPhase] = useState<"in_progress" | "completed">("completed");

  /** Тип следующего загружаемого фото в портфолио (для выбранного проекта ниже) */
  const [nextImageRole, setNextImageRole] = useState<
    "gallery" | "site_start" | "site_end" | "work_in_progress"
  >("gallery");

  const [promoYoutubeUrl, setPromoYoutubeUrl] = useState("");
  const [promoVideoTitle, setPromoVideoTitle] = useState("");
  const [promoVideoCaption, setPromoVideoCaption] = useState("");
  const [promoVideoCategories, setPromoVideoCategories] = useState<string[]>([]);

  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setDescription(company.description || "");
      const fromJoin = (company as { company_categories?: { category: string }[] }).company_categories?.map(
        (r) => r.category,
      ).filter(Boolean) ?? [];
      setSelectedCategories(fromJoin.length > 0 ? fromJoin : company.category ? [company.category] : []);
      setCity(company.city || "");
      setAddress(company.address || "");
      setPhone(company.phone || "");
      setEmail(company.email || "");
      setWebsite(company.website || "");
      setLogoUrl(company.logo_url || "");
    }
  }, [company]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Компания не найдена</p>
          <Button asChild><Link to="/profile">В профиль</Link></Button>
        </div>
      </div>
    );
  }

  // Check ownership
  if (profile && company.owner_id !== profile.id) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">У вас нет прав для управления этой компанией</p>
          <Button asChild><Link to={`/company/${id}`}>Перейти к компании</Link></Button>
        </div>
      </div>
    );
  }

  const handleSaveCompany = async () => {
    if (!name.trim()) {
      toast.error("Введите название компании");
      return;
    }
    if (!phone.trim()) {
      toast.error("Укажите телефон компании");
      return;
    }
    if (!address.trim()) {
      toast.error("Укажите адрес компании");
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error("Выберите хотя бы одну категорию");
      return;
    }
    try {
      await replaceCompanyCategories.mutateAsync({
        companyId: id!,
        categories: selectedCategories,
      });
      await updateCompany.mutateAsync({
        id: id!,
        name: name.trim(),
        description: description.trim() || null,
        category: selectedCategories[0],
        city,
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        logo_url: logoUrl || null,
      });
      toast.success("Компания обновлена");
    } catch (error: any) {
      toast.error(error?.message || "Ошибка при обновлении");
    }
  };

  const handleAddService = async () => {
    if (!serviceName.trim()) {
      toast.error("Введите название услуги");
      return;
    }
    try {
      await createService.mutateAsync({
        company_id: id!,
        name: serviceName.trim(),
        description: serviceDescription.trim() || undefined,
        price_from: servicePriceFrom ? Number(servicePriceFrom) : undefined,
        price_to: servicePriceTo ? Number(servicePriceTo) : undefined,
        vitrine_category: serviceCategory,
      });
      toast.success("Услуга добавлена и появится в каталоге «Услуги»");
      setServiceDialogOpen(false);
      setServiceName("");
      setServiceDescription("");
      setServicePriceFrom("");
      setServicePriceTo("");
      setServiceCategory("Другое");
    } catch (error: any) {
      toast.error(error?.message || "Ошибка");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteService.mutateAsync({ id: serviceId, company_id: id! });
      toast.success("Услуга удалена");
    } catch {
      toast.error("Ошибка при удалении");
    }
  };

  const resetProjectForm = () => {
    setEditingProjectId(null);
    setProjectTitle("");
    setProjectDescription("");
    setProjectDate("");
    setProjectStartDate("");
    setProjectPhase("completed");
  };

  const openCreateProject = () => {
    resetProjectForm();
    setProjectDialogOpen(true);
  };

  const openEditProject = (project: {
    id: string;
    title: string;
    description?: string | null;
    completion_date?: string | null;
    start_date?: string | null;
    project_phase?: string | null;
  }) => {
    setEditingProjectId(project.id);
    setProjectTitle(project.title);
    setProjectDescription(project.description || "");
    setProjectDate(project.completion_date?.slice(0, 10) || "");
    setProjectStartDate(project.start_date?.slice(0, 10) || "");
    setProjectPhase((project.project_phase as "in_progress" | "completed") || "completed");
    setProjectDialogOpen(true);
  };

  const handleSaveProject = async () => {
    if (!projectTitle.trim()) {
      toast.error("Введите название проекта");
      return;
    }
    try {
      if (editingProjectId) {
        await updateProject.mutateAsync({
          id: editingProjectId,
          company_id: id!,
          title: projectTitle.trim(),
          description: projectDescription.trim() || null,
          completion_date: projectDate || null,
          start_date: projectStartDate || null,
          project_phase: projectPhase,
        });
        toast.success("Проект обновлён");
      } else {
        await createProject.mutateAsync({
          company_id: id!,
          title: projectTitle.trim(),
          description: projectDescription.trim() || undefined,
          completion_date: projectDate || undefined,
          start_date: projectStartDate || undefined,
          project_phase: projectPhase,
        });
        toast.success("Проект добавлен");
      }
      setProjectDialogOpen(false);
      resetProjectForm();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Ошибка";
      toast.error(msg);
    }
  };

  const handleDeleteProjectImage = async (imageId: string, imageUrl: string) => {
    if (!window.confirm("Удалить это фото?")) return;
    try {
      await deleteProjectImage.mutateAsync({ imageId, imageUrl, company_id: id! });
      await deleteImage(imageUrl, "projects");
      toast.success("Фото удалено");
    } catch {
      toast.error("Не удалось удалить фото");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject.mutateAsync({ id: projectId, company_id: id! });
      toast.success("Проект удалён");
    } catch {
      toast.error("Ошибка при удалении");
    }
  };

  const handleUploadProjectImage = async (
    projectId: string,
    file: File,
    imageRole: "gallery" | "site_start" | "site_end" | "work_in_progress" = "gallery"
  ) => {
    const url = await uploadImage(file, "projects");
    if (url) {
      try {
        await addProjectImage.mutateAsync({
          project_id: projectId,
          image_url: url,
          company_id: id!,
          image_role: imageRole,
        });
        toast.success("Изображение добавлено");
      } catch {
        toast.error("Ошибка при сохранении изображения");
      }
    }
  };

  const handleAddPromoVideo = async () => {
    const videoId = parseYouTubeVideoId(promoYoutubeUrl);
    if (!videoId) {
      toast.error("Вставьте корректную ссылку на YouTube или ID ролика (11 символов)");
      return;
    }
    try {
      const cats = [...new Set(promoVideoCategories.map((c) => c.trim()).filter(Boolean))];
      await createPromoPost.mutateAsync({
        companyId: id!,
        youtubeVideoId: videoId,
        title: promoVideoTitle.trim() || "Презентация компании",
        caption: promoVideoCaption.trim() || undefined,
        categories: cats.length ? cats : undefined,
      });
      toast.success("Ролик добавлен — он появится в витрине «Витрина роликов»");
      setPromoYoutubeUrl("");
      setPromoVideoTitle("");
      setPromoVideoCaption("");
      setPromoVideoCategories([]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      toast.error(msg);
    }
  };

  const handleDeletePromoVideo = async (postId: string) => {
    if (!window.confirm("Удалить ролик из витрины?")) return;
    try {
      await deletePromoPost.mutateAsync({ postId, companyId: id! });
      toast.success("Ролик удалён");
    } catch {
      toast.error("Не удалось удалить");
    }
  };

  const services = company.company_services || [];
  const projects = company.projects || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" asChild>
              <Link to={`/company/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                К профилю компании
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Управление компанией</h1>
              <p className="text-muted-foreground">{company.name}</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 h-auto p-1">
              <TabsTrigger value="info" className="text-xs sm:text-sm px-2">
                Информация
              </TabsTrigger>
              <TabsTrigger value="verification" className="text-xs sm:text-sm px-2">
                Верификация
              </TabsTrigger>
              <TabsTrigger value="services" className="text-xs sm:text-sm px-2">
                Услуги ({services.length})
              </TabsTrigger>
              <TabsTrigger value="projects" className="text-xs sm:text-sm px-2">
                Проекты ({projects.length})
              </TabsTrigger>
              <TabsTrigger value="videos" className="text-xs sm:text-sm px-2">
                Видео ({promoPosts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="verification">
              {profile ? (
                <CompanyVerificationPanel
                  companyId={id!}
                  status={
                    ((company as { verification_status?: CompanyVerificationStatus }).verification_status ||
                      "draft") as CompanyVerificationStatus
                  }
                  rejectionReason={
                    (company as { rejection_reason?: string | null }).rejection_reason
                  }
                  profileId={profile.id}
                />
              ) : null}
            </TabsContent>

            {/* Company Info Tab */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Основная информация</CardTitle>
                  <CardDescription>Редактируйте данные вашей компании</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Logo Upload Area */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/30">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg transition-colors font-medium">
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          Изменить логотип
                        </div>
                      </Label>
                      <input 
                        id="logo-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        disabled={isUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await uploadImage(file, "logos");
                          if (url) setLogoUrl(url);
                          e.target.value = "";
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">Рекомендуется квадратное лого, до 5MB</p>
                      {logoUrl ? (
                        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setLogoUrl("")}>
                          Убрать логотип
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Название *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
                  </div>

                  <div className="space-y-2">
                    <SearchableMultiCategoryPicker
                      options={categories}
                      value={selectedCategories}
                      onChange={setSelectedCategories}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Город *</Label>
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000} />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Адрес *</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Телефон *</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email (необязательно)</Label>
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Веб-сайт (необязательно)</Label>
                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={255} />
                  </div>

                  <Button onClick={handleSaveCompany} disabled={updateCompany.isPending || replaceCompanyCategories.isPending} className="w-full">
                    {updateCompany.isPending || replaceCompanyCategories.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Сохранение...</> : "Сохранить изменения"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Услуги</CardTitle>
                    <CardDescription>Управляйте списком услуг вашей компании</CardDescription>
                  </div>
                  <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-2" />Добавить</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Новая услуга</DialogTitle>
                        <DialogDescription>Добавьте услугу в каталог компании</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Название *</Label>
                          <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Монтаж кровли" />
                        </div>
                        <div className="space-y-2">
                          <Label>Описание</Label>
                          <Textarea value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} placeholder="Описание услуги..." rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Цена от (₸)</Label>
                            <Input type="number" value={servicePriceFrom} onChange={(e) => setServicePriceFrom(e.target.value)} placeholder="50000" />
                          </div>
                          <div className="space-y-2">
                            <Label>Цена до (₸)</Label>
                            <Input type="number" value={servicePriceTo} onChange={(e) => setServicePriceTo(e.target.value)} placeholder="200000" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Категория в каталоге «Услуги» *</Label>
                          <Select value={serviceCategory} onValueChange={setServiceCategory}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_VITRINE_CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>Отмена</Button>
                        <Button onClick={handleAddService} disabled={createService.isPending}>
                          {createService.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Добавить"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {services.length > 0 ? (
                    <div className="space-y-3">
                      {services.map((service: any) => (
                        <div key={service.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
                            {service.price_from && (
                              <p className="text-sm text-primary font-medium mt-1">
                                от {Number(service.price_from).toLocaleString()} ₸
                                {service.price_to && ` до ${Number(service.price_to).toLocaleString()} ₸`}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">Услуги ещё не добавлены</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Портфолио</CardTitle>
                    <CardDescription>Добавляйте выполненные проекты</CardDescription>
                  </div>
                  <Dialog
                    open={projectDialogOpen}
                    onOpenChange={(open) => {
                      setProjectDialogOpen(open);
                      if (!open) resetProjectForm();
                    }}
                  >
                    <Button size="sm" type="button" onClick={openCreateProject}>
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingProjectId ? "Изменить проект" : "Новый проект"}</DialogTitle>
                        <DialogDescription>
                          {editingProjectId
                            ? "Обновите данные и сохраните"
                            : "Добавьте проект в портфолио"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Название *</Label>
                          <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Строительство коттеджа" />
                        </div>
                        <div className="space-y-2">
                          <Label>Описание</Label>
                          <Textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Описание проекта..." rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>Дата начала (необязательно)</Label>
                          <Input type="date" value={projectStartDate} onChange={(e) => setProjectStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Дата завершения (необязательно)</Label>
                          <Input type="date" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Статус проекта *</Label>
                          <Select value={projectPhase} onValueChange={(v) => setProjectPhase(v as "in_progress" | "completed")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_progress">В процессе</SelectItem>
                              <SelectItem value="completed">Завершён</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
                          Отмена
                        </Button>
                        <Button
                          onClick={() => void handleSaveProject()}
                          disabled={createProject.isPending || updateProject.isPending}
                        >
                          {createProject.isPending || updateProject.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : editingProjectId ? (
                            "Сохранить"
                          ) : (
                            "Добавить"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {projects.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-muted/20 text-sm">
                        <span className="text-muted-foreground">Тип следующего загружаемого фото:</span>
                        <Select value={nextImageRole} onValueChange={(v) => setNextImageRole(v as typeof nextImageRole)}>
                          <SelectTrigger className="h-9 w-[220px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gallery">Галерея</SelectItem>
                            <SelectItem value="site_start">Начало объекта</SelectItem>
                            <SelectItem value="work_in_progress">Ход работ</SelectItem>
                            <SelectItem value="site_end">Завершение / сдача</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {projects.map((project: any) => (
                        <div key={project.id} className="p-4 rounded-lg border bg-muted/30">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-lg">{project.title}</p>
                                <span
                                  className={
                                    project.project_phase === "in_progress"
                                      ? "text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"
                                      : "text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100"
                                  }
                                >
                                  {project.project_phase === "in_progress" ? "В процессе" : "Завершён"}
                                </span>
                              </div>
                              {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
                              {project.start_date && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Старт: {formatDisplayDate(project.start_date) || project.start_date}
                                </p>
                              )}
                              {project.completion_date && (
                                <p className="text-xs text-muted-foreground">
                                  Завершение: {formatDisplayDate(project.completion_date) || project.completion_date}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() => openEditProject(project)}
                                aria-label="Изменить проект"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() => void handleDeleteProject(project.id)}
                                className="text-destructive hover:text-destructive"
                                aria-label="Удалить проект"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Project images */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {project.project_images?.map((img: any) => {
                              const roleRu: Record<string, string> = {
                                gallery: "Галерея",
                                site_start: "Начало",
                                site_end: "Конец",
                                work_in_progress: "Процесс",
                              };
                              return (
                              <div key={img.id} className="w-24 h-24 rounded-lg overflow-hidden border relative group/img">
                                <img src={img.image_url} alt={img.caption || project.title} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  className="absolute top-0.5 right-0.5 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-90 hover:opacity-100"
                                  aria-label="Удалить фото"
                                  onClick={() => void handleDeleteProjectImage(img.id, img.image_url)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-white text-center py-0.5 truncate px-1">
                                  {roleRu[img.image_role] || "Фото"}
                                </span>
                              </div>
                            );})}
                            <label className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                              {isUploading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              ) : (
                                <>
                                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                                  <span className="text-[10px] text-muted-foreground">Фото</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={isUploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadProjectImage(project.id, file, nextImageRole);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">Проекты ещё не добавлены</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="videos">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clapperboard className="h-5 w-5 text-primary" />
                    Презентационные ролики
                  </CardTitle>
                  <CardDescription>
                    Видео хранится на YouTube: загрузите ролик в свой аккаунт YouTube и вставьте ссылку сюда. Карточка
                    появится в общей ленте; лайки и комментарии остаются на платформе для будущих рекомендаций.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-xl border bg-muted/20 p-4 sm:p-5 space-y-4">
                    <div className="space-y-2">
                      <Label>Ссылка на YouTube *</Label>
                      <Input
                        value={promoYoutubeUrl}
                        onChange={(e) => setPromoYoutubeUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=… или https://youtu.be/…"
                        className="rounded-xl bg-background"
                      />
                      <p className="text-xs text-muted-foreground">
                        Поддерживаются обычные ролики, embed и Shorts. Храним только ID — встраивание через YouTube.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Заголовок на витрине</Label>
                      <Input
                        value={promoVideoTitle}
                        onChange={(e) => setPromoVideoTitle(e.target.value)}
                        placeholder="Например: Наш бетон за 60 секунд"
                        className="rounded-xl bg-background"
                        maxLength={200}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Краткое описание (необязательно)</Label>
                      <Textarea
                        value={promoVideoCaption}
                        onChange={(e) => setPromoVideoCaption(e.target.value)}
                        placeholder="Что зритель увидит в ролике…"
                        rows={3}
                        className="rounded-xl bg-background resize-none"
                        maxLength={500}
                      />
                    </div>
                    <SearchableMultiCategoryPicker
                      options={BUSINESS_CATEGORIES}
                      value={promoVideoCategories}
                      onChange={setPromoVideoCategories}
                      label="О чём этот ролик"
                      description="Любые направления из общего справочника — так ролик попадёт в фильтры на витрине и не привязан только к категориям карточки компании."
                    />
                    <Button
                      type="button"
                      onClick={handleAddPromoVideo}
                      disabled={createPromoPost.isPending}
                      className="rounded-xl w-full sm:w-auto"
                    >
                      {createPromoPost.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Сохранение…
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Добавить в витрину
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    <Button variant="outline" size="sm" className="rounded-xl" asChild>
                      <Link to="/feed">Открыть ленту «Витрина роликов»</Link>
                    </Button>
                  </div>

                  {promoPosts.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground">Опубликовано</h4>
                      {promoPosts.map((row) => {
                        const vc =
                          row.company_promo_post_categories?.map((x) => x.category).filter(Boolean) ?? [];
                        return (
                        <div
                          key={row.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card"
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">{row.title || "Без названия"}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">ID: {row.youtube_video_id}</p>
                            {row.caption ? (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{row.caption}</p>
                            ) : null}
                            {vc.length > 0 ? (
                              <p className="text-xs text-muted-foreground mt-1">
                                Темы: <span className="text-foreground">{vc.join(" · ")}</span>
                              </p>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive shrink-0 self-end sm:self-center"
                            onClick={() => handleDeletePromoVideo(row.id)}
                            aria-label="Удалить ролик"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-muted-foreground text-sm">Пока нет роликов в ленте</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ManageCompany;
