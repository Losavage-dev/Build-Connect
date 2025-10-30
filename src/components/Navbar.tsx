import { Link } from "react-router-dom";
import { Building2, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
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
          <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
            <Link to="/profile">
              <User className="h-5 w-5" />
            </Link>
          </Button>
          
          <Button asChild className="hidden md:flex">
            <Link to="/auth">Войти</Link>
          </Button>

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
                <Link to="/profile" className="text-lg font-medium hover:text-primary transition-colors">
                  Профиль
                </Link>
                <Button asChild className="mt-4">
                  <Link to="/auth">Войти</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
