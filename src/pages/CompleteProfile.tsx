import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { isIdentityNameEditable, isIdentityPhoneEditable } from "@/lib/profileIdentity";
import { hasCompletedOnboardingIntent, setOnboardingIntent } from "@/lib/onboarding";
import { completeProfileSchema, firstZodError } from "@/lib/validation";
import { translateValidationError } from "@/lib/validation/translateError";
import { formatKzPhoneDisplay, normalizeKzPhone } from "@/lib/phone";
import { toast } from "sonner";

type Step = "profile" | "intent";

const CompleteProfile = () => {
  const { t } = useTranslation(["profile", "common", "validation"]);
  const navigate = useNavigate();
  const { user, profile, isLoading, updateProfile, signOut } = useAuth();
  const [step, setStep] = useState<Step>("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const syncedProfileIdRef = useRef<string | null>(null);

  const namesEditable = isIdentityNameEditable(profile);
  const phoneEditable = isIdentityPhoneEditable(profile);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (!profile) {
      syncedProfileIdRef.current = null;
      return;
    }
    if (syncedProfileIdRef.current === profile.id) return;
    syncedProfileIdRef.current = profile.id;
    setFirstName((profile.first_name ?? "").trim());
    setLastName((profile.last_name ?? "").trim());
    setPhone(normalizeKzPhone((profile.phone ?? "").trim()) ?? (profile.phone ?? "").trim());
    setCity((profile.city ?? "").trim());
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

    const parsed = completeProfileSchema.safeParse({
      firstName: namesEditable ? firstName : (profile?.first_name ?? "").trim(),
      lastName: namesEditable ? lastName : (profile?.last_name ?? "").trim(),
      phone,
      city,
    });
    const err = firstZodError(parsed);
    if (err) {
      toast.error(translateValidationError(err, t));
      return;
    }
    if (!parsed.success) return;

    setSaving(true);
    try {
      const payload: {
        first_name?: string;
        last_name?: string;
        phone?: string;
        city: string;
      } = { city: parsed.data.city };

      if (namesEditable) {
        payload.first_name = parsed.data.firstName;
        payload.last_name = parsed.data.lastName;
      }
      if (phoneEditable) {
        payload.phone = parsed.data.phone;
      }

      await updateProfile(payload);
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 blueprint-grid opacity-40" aria-hidden />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
      <Navbar />
      <div className="container max-w-lg mx-auto px-4 py-12 relative flex-1">
        <div className="flex justify-center gap-2 mb-8">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">BuildConnect</span>
        </div>

        {step === "profile" ? (
          <Card className="rounded-2xl border-border/60 bg-card/95 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle>{t("completeProfile.title")}</CardTitle>
              <CardDescription>{t("completeProfile.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fn">{t("completeProfile.firstName")}</Label>
                    <Input
                      id="fn"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={!namesEditable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ln">{t("completeProfile.lastName")}</Label>
                    <Input
                      id="ln"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={!namesEditable}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph">{t("completeProfile.phone")}</Label>
                  <Input
                    id="ph"
                    type="tel"
                    placeholder="+7 700 123 45 67"
                    value={phoneEditable ? phone : formatKzPhoneDisplay(phone)}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={!phoneEditable}
                    maxLength={18}
                  />
                  {phoneEditable ? (
                    <p className="text-xs text-muted-foreground">{t("completeProfile.phoneHint")}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>{t("completeProfile.city")}</Label>
                  <SearchableCitySelect
                    cities={KAZAKHSTAN_CITIES}
                    value={city}
                    onChange={setCity}
                    placeholder={t("common:selectCity")}
                  />
                </div>
                <Button type="submit" className="w-full rounded-xl btn-glow" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("completeProfile.continue")}
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
                  {t("completeProfile.signOut")}
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-border/60 bg-card/95 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle>{t("completeProfile.intentTitle")}</CardTitle>
              <CardDescription>{t("completeProfile.intentSubtitle")}</CardDescription>
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
                    <p className="font-semibold">{t("completeProfile.createCompanyTitle")}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("completeProfile.createCompanyDesc")}
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
                    <p className="font-semibold">{t("completeProfile.buyOnlyTitle")}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("completeProfile.buyOnlyDesc")}
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
