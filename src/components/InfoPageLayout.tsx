import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { PageHero } from "@/components/layout/PageHero";

type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
  children: React.ReactNode;
  maxWidth?: "md" | "lg" | "xl";
};

export default function InfoPageLayout({
  title,
  description,
  eyebrow,
  children,
  maxWidth = "lg",
}: Props) {
  const { t } = useTranslation("info");
  const maxW =
    maxWidth === "xl" ? "max-w-4xl" : maxWidth === "md" ? "max-w-2xl" : "max-w-3xl";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero eyebrow={eyebrow ?? t("eyebrow")} title={title} description={description} compact />

      <section className="py-8 md:py-12 bg-muted/15 border-b">
        <div className={`container px-4 ${maxW} mx-auto`}>
          <Button variant="ghost" asChild className="mb-6 -ml-2 rounded-xl">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backHome")}
            </Link>
          </Button>

          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur p-6 md:p-8 shadow-sm space-y-6 text-muted-foreground leading-relaxed">
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
