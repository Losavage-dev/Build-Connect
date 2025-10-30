import { useParams, Link } from "react-router-dom";
import { MapPin, Star, Phone, Mail, Globe, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";

const CompanyProfile = () => {
  const { id } = useParams();

  // Mock data - later will be fetched from database
  const company = {
    id: id,
    name: "СтройМастер KZ",
    description: "Полный цикл строительных работ. Специализируемся на строительстве жилых и коммерческих объектов. Наша компания работает на рынке Казахстана более 15 лет.",
    city: "Алматы",
    rating: 4.8,
    reviewCount: 156,
    category: "Строительство",
    phone: "+7 (727) 123-45-67",
    email: "info@stroymaster.kz",
    website: "www.stroymaster.kz",
    projects: [
      { id: 1, title: "ЖК Алатау", image: null },
      { id: 2, title: "Бизнес-центр Сенатор", image: null },
      { id: 3, title: "Торговый центр Mega", image: null },
      { id: 4, title: "Жилой комплекс Нурлы Тау", image: null },
    ],
    reviews: [
      {
        id: 1,
        author: "Алия К.",
        rating: 5,
        date: "15 янв 2025",
        text: "Отличная компания! Построили коттедж под ключ. Качество работы на высоте, сроки соблюдены.",
      },
      {
        id: 2,
        author: "Марат Б.",
        rating: 4,
        date: "10 янв 2025",
        text: "Профессиональная команда. Были небольшие задержки, но результат того стоил.",
      },
    ],
    services: [
      "Строительство домов",
      "Капитальный ремонт",
      "Проектирование",
      "Внутренняя отделка",
      "Фасадные работы",
    ],
  };

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
                  {company.name.charAt(0)}
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
                <span className="text-2xl font-bold">{company.rating}</span>
                <span className="text-muted-foreground">({company.reviewCount} отзывов)</span>
              </div>
            </div>

            <Card className="md:w-80 shrink-0">
              <CardHeader>
                <CardTitle>Контакты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <a href={`tel:${company.phone}`} className="hover:text-primary transition-colors">
                    {company.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <a href={`mailto:${company.email}`} className="hover:text-primary transition-colors">
                    {company.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    {company.website}
                  </a>
                </div>
                <Separator />
                <Button className="w-full" size="lg">
                  Отправить заявку
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Услуги</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {company.services.map((service, index) => (
                    <Badge key={index} variant="secondary">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio */}
            <Card>
              <CardHeader>
                <CardTitle>Портфолио</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {company.projects.map((project) => (
                    <div key={project.id} className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">{project.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Отзывы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {company.reviews.map((review) => (
                  <div key={review.id}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{review.author}</p>
                        <p className="text-sm text-muted-foreground">{review.date}</p>
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
                    <p className="text-muted-foreground">{review.text}</p>
                    {review.id !== company.reviews[company.reviews.length - 1].id && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                ))}
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
                  <p className="font-medium mb-1">Опыт работы</p>
                  <p className="text-muted-foreground">Более 15 лет</p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium mb-1">Выполненных проектов</p>
                  <p className="text-muted-foreground">250+</p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium mb-1">Сотрудников</p>
                  <p className="text-muted-foreground">50+</p>
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
