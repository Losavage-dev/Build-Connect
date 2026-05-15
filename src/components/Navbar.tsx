import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Search, User, Menu, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useInboxCounts } from "@/hooks/useInboxCounts";
import { useInboxRealtime } from "@/hooks/useInboxRealtime";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveUniversalSearchPath } from "@/lib/universalSearchRoute";
import { isStaffRole } from "@/lib/userRoles";

const Navbar = () => {
  const { user, profile, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: inbox } = useInboxCounts();
  useInboxRealtime();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const path = await resolveUniversalSearchPath(q);
    navigate(path);
    setSearchQuery("");
  };

  const getInitials = () => {
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:shadow-[var(--shadow-button)] transition-shadow">
              <Building2 className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">BuildConnect</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/catalog" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              Компании
            </Link>
            <Link to="/feed" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              Витрина роликов
            </Link>
            <Link to="/tenders" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              Тендеры
            </Link>
            <Link to="/services" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              Услуги
            </Link>
            <Link to="/materials" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              Материалы
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Компании, услуги, материалы, тендеры..."
              className="pl-10 rounded-xl bg-muted/50 border-transparent focus-visible:border-primary/30 focus-visible:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border hover:ring-border transition-all overflow-visible">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.first_name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials()}</AvatarFallback>
                  </Avatar>
                  {(inbox?.total ?? 0) > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center border-2 border-background">
                      {inbox!.total > 9 ? "9+" : inbox!.total}
                    </span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-3">
                  <div className="flex flex-col space-y-1 leading-none">
                    {profile?.first_name && (
                      <p className="font-semibold">{profile.first_name} {profile.last_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Личный кабинет
                  </Link>
                </DropdownMenuItem>
                {!isStaffRole(profile?.role) ? (
                  <DropdownMenuItem asChild>
                    <Link to="/create-company">
                      <Building2 className="mr-2 h-4 w-4" />
                      Добавить компанию
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                {isStaffRole(profile?.role) ? (
                  <DropdownMenuItem asChild>
                    <Link to="/profile?tab=reports">
                      <Shield className="mr-2 h-4 w-4" />
                      Кабинет модератора
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild className="hidden md:flex rounded-xl btn-glow font-semibold">
                <Link to="/auth">Войти</Link>
              </Button>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/catalog" className="text-lg font-medium hover:text-primary transition-colors">
                  Компании
                </Link>
                <Link to="/feed" className="text-lg font-medium hover:text-primary transition-colors">
                  Витрина роликов
                </Link>
                <Link to="/tenders" className="text-lg font-medium hover:text-primary transition-colors">
                  Тендеры
                </Link>
                <Link to="/services" className="text-lg font-medium hover:text-primary transition-colors">
                  Услуги
                </Link>
                <Link to="/materials" className="text-lg font-medium hover:text-primary transition-colors">
                  Материалы
                </Link>
                {user ? (
                  <>
                    <Link to="/profile" className="text-lg font-medium hover:text-primary transition-colors">
                      Профиль
                    </Link>
                    {!isStaffRole(profile?.role) ? (
                      <Link to="/create-company" className="text-lg font-medium hover:text-primary transition-colors">
                        Добавить компанию
                      </Link>
                    ) : null}
                    {isStaffRole(profile?.role) ? (
                      <Link to="/profile?tab=reports" className="text-lg font-medium hover:text-primary transition-colors">
                        Кабинет модератора
                      </Link>
                    ) : null}
                    <Button variant="outline" onClick={handleSignOut} className="mt-4 rounded-xl">
                      Выйти
                    </Button>
                  </>
                ) : (
                  <Button asChild className="mt-4 rounded-xl btn-glow">
                    <Link to="/auth">Войти</Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
