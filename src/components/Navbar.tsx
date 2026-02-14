import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Search, User, Menu, LogOut } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const { user, profile, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
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
            <Link to="/catalog?category=Материалы" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              Материалы
            </Link>
            <Link to="/catalog?category=Аренда техники" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              Аренда техники
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск компаний и услуг..."
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
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.first_name || "User"} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials()}</AvatarFallback>
                  </Avatar>
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
                {profile?.role !== "client" && (
                  <DropdownMenuItem asChild>
                    <Link to="/create-company">
                      <Building2 className="mr-2 h-4 w-4" />
                      Добавить компанию
                    </Link>
                  </DropdownMenuItem>
                )}
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
                <Link to="/catalog?category=Материалы" className="text-lg font-medium hover:text-primary transition-colors">
                  Материалы
                </Link>
                <Link to="/catalog?category=Аренда техники" className="text-lg font-medium hover:text-primary transition-colors">
                  Аренда техники
                </Link>
                {user ? (
                  <>
                    <Link to="/profile" className="text-lg font-medium hover:text-primary transition-colors">
                      Профиль
                    </Link>
                    {profile?.role !== "client" && (
                      <Link to="/create-company" className="text-lg font-medium hover:text-primary transition-colors">
                        Добавить компанию
                      </Link>
                    )}
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
