import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { safeRedirectPath } from "@/lib/authRedirect";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  REGISTRATION_ROLE_NOTE,
  USER_ROLE_HINTS,
  USER_ROLE_LABELS,
  type UserRole,
} from "@/lib/userRoles";
import { firstZodError, loginSchema, registerSchema } from "@/lib/validation";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user } = useAuth();
  const afterAuth = safeRedirectPath(searchParams.get("redirect"));
  const [isLoading, setIsLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
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
      toast.error(err);
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
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regUserType,
    });
    const err = firstZodError(parsed);
    if (err) {
      toast.error(err);
      return;
    }
    setIsLoading(true);
    try {
      await signUp(regEmail.trim(), regPassword, regName.trim(), regUserType);
    } catch {
      // handled in context
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">BuildConnect</span>
        </Link>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Вход в аккаунт</CardTitle>
                <CardDescription>Введите email и пароль для входа</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="example@mail.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input id="password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Загрузка..." : "Войти"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Создать аккаунт</CardTitle>
                <CardDescription>
                  Выберите основной сценарий — позже можно и заказывать, и продавать через компанию в профиле.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя</Label>
                    <Input id="name" type="text" placeholder="Ваше имя" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input id="reg-email" type="email" placeholder="example@mail.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Пароль</Label>
                    <Input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-type">Основной сценарий</Label>
                    <Select value={regUserType} onValueChange={(v) => setRegUserType(v as UserRole)}>
                      <SelectTrigger id="user-type">
                        <SelectValue placeholder="Выберите сценарий" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">{USER_ROLE_LABELS.client}</SelectItem>
                        <SelectItem value="contractor">{USER_ROLE_LABELS.contractor}</SelectItem>
                        <SelectItem value="supplier">{USER_ROLE_LABELS.supplier}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground leading-relaxed">{USER_ROLE_HINTS[regUserType]}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{REGISTRATION_ROLE_NOTE}</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Загрузка..." : "Зарегистрироваться"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Продолжая, вы соглашаетесь с нашими{" "}
          <Link to="/terms" className="text-primary hover:underline">
            условиями использования
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
