import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Building2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-7xl font-black text-primary mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Страница не найдена</p>
        <Button asChild size="lg" className="rounded-xl btn-glow">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            На главную
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
