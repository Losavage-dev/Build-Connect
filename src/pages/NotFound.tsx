import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { PageContent } from "@/components/layout/PageHero";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 blueprint-grid opacity-50" aria-hidden />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="container relative px-4 py-16 md:py-20 text-center">
          <p className="text-7xl md:text-8xl font-black gradient-text mb-4">404</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Страница не найдена</h1>
          <p className="text-muted-foreground mb-0 max-w-md mx-auto">
            Запрашиваемый адрес не существует или был перемещён.
          </p>
        </div>
      </section>
      <PageContent className="border-b-0">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <Button asChild size="lg" className="rounded-xl btn-glow">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              На главную
            </Link>
          </Button>
        </div>
      </PageContent>
    </div>
  );
};

export default NotFound;
