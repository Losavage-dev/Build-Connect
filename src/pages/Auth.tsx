import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { safeRedirectPath } from "@/lib/authRedirect";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoleLabel } from "@/lib/i18nCatalog";
import { type UserRole } from "@/lib/userRoles";
import { firstZodError, loginSchema, registerSchema } from "@/lib/validation";
import { translateValidationError } from "@/lib/validation/translateError";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { toast } from "sonner";

const Auth = () => {
  const { t } = useTranslation(["auth", "catalogData", "validation"]);
  const roleLabel = useUserRoleLabel();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user } = useAuth();
  const afterAuth = safeRedirectPath(searchParams.get("redirect"));
  const [isLoading, setIsLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regUserType, setRegUserType] = useState<UserRole>("client");

  useEffect(() => {
    if (user) {
      navigate(afterAuth, { replace: true });
    }
  }, [user, navigate, afterAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    const err = firstZodError(parsed);
    if (err) {
      toast.error(translateValidationError(err, t));
      return;
    }
    setIsLoading(true);
    try {
      await signIn(loginEmail.trim(), loginPassword);
      navigate(afterAuth);
    } catch {
      // handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse({
      firstName: regFirstName,
      lastName: regLastName,
      email: regEmail,
      password: regPassword,
      role: regUserType,
    });
    const err = firstZodError(parsed);
    if (err) {
      toast.error(translateValidationError(err, t));
      return;
    }
    setIsLoading(true);
    try {
      await signUp(regEmail.trim(), regPassword, regFirstName.trim(), regLastName.trim(), regUserType);
    } catch {
      // handled in context
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null;

  const registrationRoles: UserRole[] = ["client", "contractor", "supplier"];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="absolute inset-0 blueprint-grid opacity-40" aria-hidden />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
      <div className="w-full max-w-md relative">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">{t("title")}</span>
        </Link>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="login">{t("loginTab")}</TabsTrigger>
            <TabsTrigger value="register">{t("registerTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="rounded-2xl border-border/60 bg-card/95 backdrop-blur shadow-sm">
              <CardHeader>
                <CardTitle>{t("loginTab")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input id="email" type="email" placeholder="example@mail.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("password")}</Label>
                    <Input id="password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full rounded-xl btn-glow" disabled={isLoading}>
                    {isLoading ? t("loggingIn") : t("loginButton")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="rounded-2xl border-border/60 bg-card/95 backdrop-blur shadow-sm">
              <CardHeader>
                <CardTitle>{t("registerTab")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">{t("firstName")}</Label>
                      <Input
                        id="first-name"
                        type="text"
                        placeholder={t("firstName")}
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">{t("lastName")}</Label>
                      <Input
                        id="last-name"
                        type="text"
                        placeholder={t("lastName")}
                        value={regLastName}
                        onChange={(e) => setRegLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">{t("email")}</Label>
                    <Input id="reg-email" type="email" placeholder="example@mail.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">{t("password")}</Label>
                    <Input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-type">{t("accountType")}</Label>
                    <Select value={regUserType} onValueChange={(v) => setRegUserType(v as UserRole)}>
                      <SelectTrigger id="user-type">
                        <SelectValue placeholder={t("accountType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {registrationRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleLabel(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t(`userRoleHints.${regUserType}`, { ns: "catalogData" })}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t("roleNote")}</p>
                  </div>
                  <Button type="submit" className="w-full rounded-xl btn-glow" disabled={isLoading}>
                    {isLoading ? t("registering") : t("registerButton")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link to="/terms" className="text-primary hover:underline">
            {t("home:footer.terms")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
