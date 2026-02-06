import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateCompany } from "@/hooks/useCompanies";
import { toast } from "sonner";

const categories = [
  { value: "construction", label: "Строительство" },
  { value: "renovation", label: "Ремонт" },
  { value: "equipment", label: "Аренда техники" },
  { value: "materials", label: "Материалы" },
  { value: "design", label: "Проектирование" },
  { value: "engineering", label: "Инженерные системы" },
];

const cities = ["Алматы", "Астана", "Шымкент", "Караганда", "Актобе"];

const CreateCompany = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const createCompany = useCreateCompany();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  // Only contractors and suppliers can create companies
  if (!authLoading && profile && profile.role === "client") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-16 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Доступ ограничен</h1>
          <p className="text-muted-foreground mb-6">
            Создание компании доступно только подрядчикам и поставщикам.
            Измените тип аккаунта в настройках профиля.
          </p>
          <Button onClick={() => navigate("/profile")}>Перейти в профиль</Button>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.length > 100) {
      toast.error("Введите название компании (до 100 символов)");
      return;
    }
    if (!category) {
      toast.error("Выберите категорию");
      return;
    }
    if (!city) {
      toast.error("Выберите город");
      return;
    }
    if (!profile) {
      toast.error("Профиль не загружен");
      return;
    }
    if (phone && phone.length > 20) {
      toast.error("Телефон слишком длинный");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Введите корректный email");
      return;
    }

    try {
      const result = await createCompany.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        category,
        city,
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        logo_url: null,
        owner_id: profile.id,
      });
      toast.success("Компания успешно создана!");
      navigate(`/company/${result.id}`);
    } catch (error: any) {
      toast.error(error?.message || "Ошибка при создании компании");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Добавить компанию
              </CardTitle>
              <CardDescription>
                Заполните информацию о вашей компании. Она появится в каталоге после создания.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Основная информация
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="name">Название компании *</Label>
                    <Input
                      id="name"
                      placeholder="ООО СтройМастер"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Категория *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Город *</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите город" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      placeholder="Расскажите о вашей компании, опыте работы и преимуществах..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {description.length}/2000
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Контактная информация
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="address">Адрес</Label>
                    <Input
                      id="address"
                      placeholder="ул. Абая 123, офис 45"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      maxLength={200}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+7 (777) 123-45-67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={20}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company-email">Email</Label>
                      <Input
                        id="company-email"
                        type="email"
                        placeholder="info@company.kz"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Веб-сайт</Label>
                    <Input
                      id="website"
                      placeholder="https://company.kz"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      maxLength={255}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={createCompany.isPending}
                >
                  {createCompany.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    "Создать компанию"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateCompany;
