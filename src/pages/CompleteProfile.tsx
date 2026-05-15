import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableCitySelect } from "@/components/SearchableCitySelect";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { KAZAKHSTAN_CITIES } from "@/lib/constants";
import { isProfileComplete } from "@/lib/profile";
import { hasCompletedOnboardingIntent, setOnboardingIntent } from "@/lib/onboarding";
import { toast } from "sonner";

type Step = "profile" | "intent";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, updateProfile, signOut } = useAuth();
  const [step, setStep] = useState<Step>("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setFirstName((profile.first_name ?? "").trim());
      setLastName((profile.last_name ?? "").trim());
      setPhone((profile.phone ?? "").trim());
      setCity((profile.city ?? "").trim());
    }
  }, [profile]);

  useEffect(() => {
    if (!isLoading && profile && isProfileComplete(profile) && hasCompletedOnboardingIntent()) {
      navigate("/profile", { replace: true });
    }
    if (!isLoading && profile && isProfileComplete(profile) && !hasCompletedOnboardingIntent()) {
      setStep("intent");
    }
  }, [isLoading, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !city.trim()) {
      toast.error("Заполните все обязательные поля");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });
      setStep("intent");
    } catch {
      // toast в контексте
    } finally {
      setSaving(false);
    }
  };

  const finishIntent = (intent: "create_company" | "buy_only") => {
    setOnboardingIntent(intent);
    if (intent === "create_company") {
      navigate("/create-company", { replace: true });
    } else {
      navigate("/profile", { replace: true });
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navbar />
      <div className="container max-w-lg mx-auto px-4 py-12">
        <div className="flex justify-center gap-2 mb-8">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">BuildConnect</span>
        </div>

        {step === "profile" ? (
          <Card>
            <CardHeader>
              <CardTitle>Заполните профиль</CardTitle>
              <CardDescription>
                Имя, телефон и город нужны, чтобы с вами могли связаться по заявкам и тендерам.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fn">Имя *</Label>
                    <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ln">Фамилия *</Label>
                    <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph">Телефон *</Label>
                  <Input
                    id="ph"
                    type="tel"
                    placeholder="+7 700 000 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Город *</Label>
                  <SearchableCitySelect cities={KAZAKHSTAN_CITIES} value={city} onChange={setCity} placeholder="Выберите город" />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Продолжить"}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    void signOut();
                    navigate("/auth", { replace: true });
                  }}
                >
                  Выйти из аккаунта
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Что планируете на платформе?</CardTitle>
              <CardDescription>
                Это подсказка для старта — позже можно и заказывать, и продавать. Компания в профиле нужна для витрины и
                откликов на тендеры.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                className="w-full text-left rounded-xl border-2 border-border hover:border-primary/50 p-4 transition-colors"
                onClick={() => finishIntent("create_company")}
              >
                <div className="flex gap-3">
                  <Store className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Создать компанию</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Каталог, услуги, материалы, отклики на тендеры от имени компании.
                    </p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                className="w-full text-left rounded-xl border-2 border-border hover:border-primary/50 p-4 transition-colors"
                onClick={() => finishIntent("buy_only")}
              >
                <div className="flex gap-3">
                  <ShoppingBag className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Пока только заказываю</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Тендеры, заявки в каталог, покупка услуг и материалов. Компанию можно добавить позже.
                    </p>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompleteProfile;
