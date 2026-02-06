import { Link } from "react-router-dom";
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

  const handleSignOut = async () => {
    await signOut();
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">BuildConnect</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/catalog" className="text-sm font-medium hover:text-primary transition-colors">
              Компании
            </Link>
            <Link to="/catalog?type=materials" className="text-sm font-medium hover:text-primary transition-colors">
              Материалы
            </Link>
            <Link to="/catalog?type=equipment" className="text-sm font-medium hover:text-primary transition-colors">
              Аренда техники
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск компаний и услуг..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.first_name || "User"} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {profile?.first_name && (
                      <p className="font-medium">{profile.first_name} {profile.last_name}</p>
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
              <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
                <Link to="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              
              <Button asChild className="hidden md:flex">
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
                <Link to="/catalog?type=materials" className="text-lg font-medium hover:text-primary transition-colors">
                  Материалы
                </Link>
                <Link to="/catalog?type=equipment" className="text-lg font-medium hover:text-primary transition-colors">
                  Аренда техники
                </Link>
                {user ? (
                  <>
                    <Link to="/profile" className="text-lg font-medium hover:text-primary transition-colors">
                      Профиль
                    </Link>
                    <Button variant="outline" onClick={handleSignOut} className="mt-4">
                      Выйти
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/profile" className="text-lg font-medium hover:text-primary transition-colors">
                      Профиль
                    </Link>
                    <Button asChild className="mt-4">
                      <Link to="/auth">Войти</Link>
                    </Button>
                  </>
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
