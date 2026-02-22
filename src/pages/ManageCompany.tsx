import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Building2, Loader2, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";
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
import { useCompany, useUpdateCompany } from "@/hooks/useCompanies";
import { useCreateService, useDeleteService } from "@/hooks/useCompanyServices";
import { useCreateProject, useDeleteProject, useAddProjectImage } from "@/hooks/useProjects";
import { useImageUpload } from "@/hooks/useImageUpload";
import { toast } from "sonner";

const categories = ["Строительство", "Ремонт", "Аренда техники", "Материалы", "Проектирование", "Инженерные системы"];
const cities = ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе"];

const ManageCompany = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { data: company, isLoading } = useCompany(id);
  const updateCompany = useUpdateCompany();
  const createService = useCreateService();
  const deleteService = useDeleteService();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const addProjectImage = useAddProjectImage();
  const { uploadImage, isUploading } = useImageUpload();

  // Company edit state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Service dialog
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePriceFrom, setServicePriceFrom] = useState("");
  const [servicePriceTo, setServicePriceTo] = useState("");

  // Project dialog
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDate, setProjectDate] = useState("");

  useEffect(() => {
    if (company) {
      setName(company.name || "");
      setDescription(company.description || "");
      setCategory(company.category || "");
      setCity(company.city || "");
      setAddress(company.address || "");
      setPhone(company.phone || "");
      setEmail(company.email || "");
      setWebsite(company.website || "");
    }
  }, [company]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

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
    try {
      await updateCompany.mutateAsync({
        id: id!,
        name: name.trim(),
        description: description.trim() || null,
        category,
        city,
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
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
      });
      toast.success("Услуга добавлена");
      setServiceDialogOpen(false);
      setServiceName("");
      setServiceDescription("");
      setServicePriceFrom("");
      setServicePriceTo("");
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

  const handleAddProject = async () => {
    if (!projectTitle.trim()) {
      toast.error("Введите название проекта");
      return;
    }
    try {
      await createProject.mutateAsync({
        company_id: id!,
        title: projectTitle.trim(),
        description: projectDescription.trim() || undefined,
        completion_date: projectDate || undefined,
      });
      toast.success("Проект добавлен");
      setProjectDialogOpen(false);
      setProjectTitle("");
      setProjectDescription("");
      setProjectDate("");
    } catch (error: any) {
      toast.error(error?.message || "Ошибка");
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

  const handleUploadProjectImage = async (projectId: string, file: File) => {
    const url = await uploadImage(file, "projects");
    if (url) {
      try {
        await addProjectImage.mutateAsync({
          project_id: projectId,
          image_url: url,
          company_id: id!,
        });
        toast.success("Изображение добавлено");
      } catch {
        toast.error("Ошибка при сохранении изображения");
      }
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

          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Информация</TabsTrigger>
              <TabsTrigger value="services">Услуги ({services.length})</TabsTrigger>
              <TabsTrigger value="projects">Проекты ({projects.length})</TabsTrigger>
            </TabsList>

            {/* Company Info Tab */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Основная информация</CardTitle>
                  <CardDescription>Редактируйте данные вашей компании</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Название *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Категория *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Город *</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000} />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Адрес</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Телефон</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Веб-сайт</Label>
                    <Input value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={255} />
                  </div>

                  <Button onClick={handleSaveCompany} disabled={updateCompany.isPending} className="w-full">
                    {updateCompany.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Сохранение...</> : "Сохранить изменения"}
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
                  <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-2" />Добавить</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Новый проект</DialogTitle>
                        <DialogDescription>Добавьте проект в портфолио</DialogDescription>
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
                          <Label>Дата завершения</Label>
                          <Input type="date" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>Отмена</Button>
                        <Button onClick={handleAddProject} disabled={createProject.isPending}>
                          {createProject.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Добавить"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {projects.length > 0 ? (
                    <div className="space-y-4">
                      {projects.map((project: any) => (
                        <div key={project.id} className="p-4 rounded-lg border bg-muted/30">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium text-lg">{project.title}</p>
                              {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
                              {project.completion_date && (
                                <p className="text-xs text-muted-foreground mt-1">Завершён: {project.completion_date}</p>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(project.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Project images */}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {project.project_images?.map((img: any) => (
                              <div key={img.id} className="w-24 h-24 rounded-lg overflow-hidden border">
                                <img src={img.image_url} alt={img.caption || project.title} className="w-full h-full object-cover" />
                              </div>
                            ))}
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
                                  if (file) handleUploadProjectImage(project.id, file);
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
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ManageCompany;
