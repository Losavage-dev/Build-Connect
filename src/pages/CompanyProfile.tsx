import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MapPin, Star, Phone, Mail, Globe, ArrowLeft, Loader2, Send, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { useCompany } from "@/hooks/useCompanies";
import { useCreateRequest } from "@/hooks/useRequests";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReviewForm from "@/components/ReviewForm";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const CompanyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: company, isLoading, error } = useCompany(id);
  const createRequest = useCreateRequest();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");

  const handleSubmitRequest = async () => {
    if (!user) {
      toast.error("Войдите, чтобы отправить заявку");
      navigate("/auth");
      return;
    }

    if (!requestTitle.trim()) {
      toast.error("Введите тему заявки");
      return;
    }

    try {
      await createRequest.mutateAsync({
        company_id: id!,
        title: requestTitle,
        description: requestDescription,
      });
      toast.success("Заявка отправлена!");
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

  if (error || !company) {
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

  const projects = company.projects || [];
  const services = company.company_services || [];
  const reviews = company.reviews || [];

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
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{company.name}</h1>
                  <div className="flex items-center gap-4 flex-wrap">
                    <Badge variant="secondary">{company.category}</Badge>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{company.city}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-lg text-muted-foreground mb-6">{company.description}</p>
              
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{Number(company.rating).toFixed(1)}</span>
                <span className="text-muted-foreground">({company.review_count} отзывов)</span>
              </div>
            </div>

            <Card className="md:w-80 shrink-0">
              <CardHeader>
                <CardTitle>Контакты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <a href={`tel:${company.phone}`} className="hover:text-primary transition-colors">
                      {company.phone}
                    </a>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <a href={`mailto:${company.email}`} className="hover:text-primary transition-colors">
                      {company.email}
                    </a>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                      {company.website}
                    </a>
                  </div>
                )}
                <Separator />
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <Send className="h-4 w-4 mr-2" />
                      Отправить заявку
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Отправить заявку</DialogTitle>
                      <DialogDescription>
                        Заполните форму для связи с компанией {company.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Тема заявки</Label>
                        <Input
                          id="title"
                          placeholder="Например: Строительство дома"
                          value={requestTitle}
                          onChange={(e) => setRequestTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Описание</Label>
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
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
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
                      <div key={project.id} className="space-y-2">
                        {project.project_images && project.project_images.length > 0 ? (
                          <div className="aspect-video rounded-lg overflow-hidden">
                            <img
                              src={project.project_images[0].image_url}
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{project.title}</p>
                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6">Проекты пока не добавлены</p>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
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

                {user && (
                  <>
                    <Separator className="my-6" />
                    <ReviewForm companyId={id!} />
                  </>
                )}
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
                  <p className="text-muted-foreground">{company.category}</p>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
