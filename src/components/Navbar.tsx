import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, User, Menu, LogOut, ChevronDown } from "lucide-react";
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
import { useMyCompanies } from "@/hooks/useServices";
import { BuildConnectLogo } from "@/components/BuildConnectLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { resolveUniversalSearchPath } from "@/lib/universalSearchRoute";
import { isStaffRole } from "@/lib/userRoles";
import { buildAccountMenuMainLinks, buildAccountMenuSecondaryLinks } from "@/lib/accountMenu";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { t } = useTranslation(["nav", "common"]);
  const { user, profile, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: inbox } = useInboxCounts();
  const { data: myCompanies } = useMyCompanies(profile?.id);
  useInboxRealtime();

  const isStaff = isStaffRole(profile?.role);
  const companyCount = myCompanies?.length ?? 0;
  const firstCompanyId = myCompanies?.[0]?.id;
  const unreadMessages = inbox?.messages ?? 0;

  const mainMenuLinks = useMemo(
    () =>
      buildAccountMenuMainLinks({
        isStaff,
        companyCount,
        firstCompanyId,
        unreadMessages,
      }),
    [isStaff, companyCount, firstCompanyId, unreadMessages],
  );
  const secondaryMenuLinks = useMemo(() => buildAccountMenuSecondaryLinks(), []);

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

  const profileLabel =
    profile?.first_name?.trim() ||
    (user?.email ? user.email.split("@")[0] : t("profile", { ns: "common" }));

  const renderMenuLink = (
    item: (typeof mainMenuLinks)[number],
    className?: string,
  ) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to}
        className={cn(
          "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
          className,
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{t(item.labelKey)}</span>
        {item.badge != null && item.badge > 0 ? (
          <span className="min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center group rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <BuildConnectLogo />
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/catalog" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              {t("companies")}
            </Link>
            <Link to="/feed" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              {t("promoFeed")}
            </Link>
            <Link to="/tenders" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              {t("tenders")}
            </Link>
            <Link to="/services" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              {t("services")}
            </Link>
            <Link to="/materials" className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted hover:text-primary transition-all">
              {t("materials")}
            </Link>
          </nav>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              className="pl-10 rounded-xl bg-muted/50 border-transparent focus-visible:border-primary/30 focus-visible:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && user ? (
            <>
            <LanguageSwitcher />
            <NotificationsDropdown />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 rounded-full px-3 gap-1.5 font-semibold shrink-0"
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span className="max-w-[140px] truncate hidden sm:inline">{profileLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70 shrink-0 hidden sm:inline" />
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
                {mainMenuLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.to} asChild>
                      <Link to={item.to} className="flex items-center cursor-pointer">
                        <Icon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {item.badge != null && item.badge > 0 ? (
                          <span className="ml-2 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                {secondaryMenuLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.to} asChild>
                      <Link to={item.to} className="cursor-pointer">
                        <Icon className="mr-2 h-4 w-4" />
                        {t(item.labelKey)}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("signOut", { ns: "common" })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <>
              <LanguageSwitcher className="hidden md:flex" />
              <Button asChild className="hidden md:flex rounded-xl btn-glow font-semibold">
                <Link to="/auth">{t("signIn", { ns: "common" })}</Link>
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
                  {t("companies")}
                </Link>
                <Link to="/feed" className="text-lg font-medium hover:text-primary transition-colors">
                  {t("promoFeed")}
                </Link>
                <Link to="/tenders" className="text-lg font-medium hover:text-primary transition-colors">
                  {t("tenders")}
                </Link>
                <Link to="/services" className="text-lg font-medium hover:text-primary transition-colors">
                  {t("services")}
                </Link>
                <Link to="/materials" className="text-lg font-medium hover:text-primary transition-colors">
                  {t("materials")}
                </Link>
                <div className="border-t pt-4">
                  <LanguageSwitcher variant="compact" />
                </div>
                {user ? (
                  <>
                    <div className="border-t pt-4 mt-2 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                        {t("account", { ns: "common" })}
                      </p>
                      {mainMenuLinks.map((item) => renderMenuLink(item, "px-1 py-1"))}
                    </div>
                    <div className="border-t pt-4 space-y-3">
                      {secondaryMenuLinks.map((item) => renderMenuLink(item, "px-1 py-1"))}
                    </div>
                    <Button variant="outline" onClick={handleSignOut} className="mt-2 rounded-xl">
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("signOut", { ns: "common" })}
                    </Button>
                  </>
                ) : (
                  <Button asChild className="mt-4 rounded-xl btn-glow">
                    <Link to="/auth">{t("signIn", { ns: "common" })}</Link>
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
