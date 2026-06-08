import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  CheckCircle2,
  Clapperboard,
  FileText,
  Package,
  Wrench,
  Building2,
  MapPin,
  Shield,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveUniversalSearchPath } from "@/lib/universalSearchRoute";

type Stat = { label: string; value: string | number };

type Props = {
  stats: Stat[];
};

const bentoTiles = [
  {
    title: "Тендеры",
    desc: "Заказчик публикует — подрядчик откликается",
    href: "/tenders",
    icon: FileText,
    accent: "primary" as const,
    span: "col-span-2 row-span-1",
  },
  {
    title: "Услуги",
    desc: "Витрина работ",
    href: "/services",
    icon: Wrench,
    accent: "secondary" as const,
    span: "col-span-1 row-span-1",
  },
  {
    title: "Материалы",
    desc: "Поставщики KZ",
    href: "/materials",
    icon: Package,
    accent: "primary" as const,
    span: "col-span-1 row-span-1",
  },
  {
    title: "Витрина роликов",
    desc: "Видео о проектах",
    href: "/feed",
    icon: Clapperboard,
    accent: "secondary" as const,
    span: "col-span-2 row-span-1",
  },
];

const quickLinks = [
  { label: "Каталог компаний", href: "/catalog", icon: Building2 },
  { label: "Тендеры", href: "/tenders", icon: FileText },
  { label: "Услуги", href: "/services", icon: Wrench },
  { label: "Материалы", href: "/materials", icon: Package },
];

export function HomeHero({ stats }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      navigate("/catalog");
      return;
    }
    const path = await resolveUniversalSearchPath(q);
    navigate(path);
    setSearchQuery("");
  };

  return (
    <section className="relative overflow-hidden border-b">
      <div className="absolute inset-0 blueprint-grid opacity-60" aria-hidden />
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden
      />
      <div className="absolute top-0 right-0 w-[min(520px,55vw)] h-[min(520px,55vw)] rounded-full bg-primary/8 blur-3xl -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-secondary/8 blur-3xl translate-y-1/3 -translate-x-1/4" />

      <div className="container px-4 relative py-16 md:py-24 lg:py-28">
        <div className="grid lg:grid-cols-[1fr_minmax(280px,420px)] gap-12 lg:gap-16 items-center">
          <div className="space-y-8 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur border border-border/60 text-sm font-medium shadow-sm animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>Проверенные строительные компании Казахстана</span>
            </div>

            <div className="space-y-5 animate-fade-in" style={{ animationDelay: "0.08s" }}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[3.5rem] font-black leading-[1.08] text-balance">
                Стройте сделки{" "}
                <span className="gradient-text">с проверенными</span>{" "}
                партнёрами
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                B2B-маркетплейс: каталог подрядчиков, тендеры, услуги, материалы и чаты по заявкам — в одном месте.
              </p>
            </div>

            <form
              onSubmit={(e) => void handleSearch(e)}
              className="flex flex-col sm:flex-row gap-3 animate-fade-in"
              style={{ animationDelay: "0.16s" }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Компания, услуга, материал или тендер..."
                  className="pl-12 h-14 text-base rounded-2xl border-2 border-border/60 bg-card/90 backdrop-blur focus-visible:border-primary/40 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 px-8 rounded-2xl btn-glow text-base font-semibold shrink-0"
              >
                Найти
              </Button>
            </form>

            <div
              className="flex flex-wrap gap-2 animate-fade-in"
              style={{ animationDelay: "0.22s" }}
            >
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium bg-card/70 backdrop-blur border border-border/60 hover:border-primary/30 hover:bg-card transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div
              className="flex flex-wrap gap-3 pt-2 animate-fade-in"
              style={{ animationDelay: "0.28s" }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/80 backdrop-blur border border-border/50 shadow-sm min-w-[7rem]"
                >
                  <p className="text-2xl font-bold tabular-nums leading-none">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium leading-tight max-w-[4.5rem]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="absolute -inset-4 rounded-[2rem] border border-dashed border-primary/20 pointer-events-none hidden lg:block" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {bentoTiles.map((tile, i) => {
                const Icon = tile.icon;
                const isPrimary = tile.accent === "primary";
                return (
                  <Link
                    key={tile.href}
                    to={tile.href}
                    className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 backdrop-blur p-4 sm:p-5 hover-lift ${tile.span}`}
                    style={{ animationDelay: `${0.1 + i * 0.06}s` }}
                  >
                    <div
                      className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-40 ${
                        isPrimary ? "bg-primary/30" : "bg-secondary/30"
                      }`}
                    />
                    <div className="relative flex flex-col h-full min-h-[5.5rem]">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div
                          className={`rounded-xl p-2.5 ${
                            isPrimary ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <p className="font-bold text-base sm:text-lg leading-tight">{tile.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                        {tile.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/50 border border-border/40 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>Алматы, Астана, Шымкент и другие города KZ</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeTrustStrip() {
  const items = [
    { icon: Shield, label: "Верификация документов модератором" },
    { icon: CheckCircle2, label: "Отзывы только после сделки" },
    { icon: FileText, label: "Тендеры и чаты по заявкам" },
    { icon: Building2, label: "Каталог B2B-компаний" },
  ];

  return (
    <section className="border-b bg-muted/30">
      <div className="container px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/60 border border-border/40"
              >
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-medium leading-snug">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
