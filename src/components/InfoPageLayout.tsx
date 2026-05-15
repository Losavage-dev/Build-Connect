import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export default function InfoPageLayout({ title, description, children }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 py-8 md:py-12 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6 -ml-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            На главную
          </Link>
        </Button>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{title}</h1>
          {description ? (
            <p className="text-lg text-muted-foreground">{description}</p>
          ) : null}
        </header>

        <div className="space-y-6 text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
