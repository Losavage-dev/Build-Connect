import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableMultiCategoryPicker } from "@/components/SearchableMultiCategoryPicker";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateCompany } from "@/hooks/useCompanies";
import { toast } from "sonner";
import { createCompanySchema, firstZodError } from "@/lib/validation";

import { BUSINESS_CATEGORIES, KAZAKHSTAN_CITIES } from "@/lib/constants";

const categories = BUSINESS_CATEGORIES;
const cities = KAZAKHSTAN_CITIES;

const CreateCompany = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const createCompany = useCreateCompany();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (!authLoading && !user) {
    return null;
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

    if (!profile) {
      toast.error("Профиль не загружен");
      return;
    }

    const parsed = createCompanySchema.safeParse({
      name,
      categories: selectedCategories,
      city,
      description,
      phone,
      email,
      website,
      address,
    });
    const validationErr = firstZodError(parsed);
    if (validationErr) {
      toast.error(validationErr);
      return;
    }

    try {
      const result = await createCompany.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        category: selectedCategories[0],
        city,
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        logo_url: null,
        owner_id: profile.id,
        categories: selectedCategories,
      });
      toast.success("Компания создана. Загрузите документы для проверки.");
      navigate(`/company/${result.id}/manage?tab=verification`);
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
                Заполните информацию о компании. После создания загрузите документы для верификации — в каталоге
                компания появится только после одобрения модератором. Можно указать несколько категорий деятельности.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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

                  <div className="space-y-2">
                    <SearchableMultiCategoryPicker
                      options={categories}
                      value={selectedCategories}
                      onChange={setSelectedCategories}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Город *</Label>
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger id="city">
                        <SelectValue placeholder="Выберите город" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {cities.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
