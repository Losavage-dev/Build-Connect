import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import {
  Archive,
  Building2,
  Flag,
  Loader2,
  LogOut,
  Scale,
  ScrollText,
  Settings as SettingsIcon,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SearchableCitySelect } from "@/components/SearchableCitySelect";
import { KAZAKHSTAN_CITIES } from "@/lib/constants";
import { PageHero, PageContent } from "@/components/layout/PageHero";
import { REPORT_ESCALATION_THRESHOLD } from "@/lib/moderationLabels";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { profileSettingsSchema, firstZodError } from "@/lib/validation";
import { normalizeKzPhone } from "@/lib/phone";
import { usePendingCompaniesForModeration } from "@/hooks/useCompanyVerification";
import { useModerationReports, type ModerationReportRow } from "@/hooks/useModerationReports";
import { ModerationCompanyCard } from "@/components/moderator/ModerationCompanyCard";
import { ModerationJournalPanel } from "@/components/moderator/ModerationJournalPanel";
import { ModerationReportDetail } from "@/components/moderator/ModerationReportDetail";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { format } from "date-fns";
import { useDateFnsLocale } from "@/hooks/useAppFormat";

const MOD_TABS = [
  "reports",
  "reports-archive",
  "journal",
  "report-detail",
  "verification",
  "settings",
] as const;
type ModTab = (typeof MOD_TABS)[number];

function ReportCard({
  report,
  onOpen,
}: {
  report: ModerationReportRow;
  onOpen: (id: string) => void;
}) {
  const { t } = useTranslation("common");
  const dateLocale = useDateFnsLocale();
  const reporterName = [report.reporter?.first_name, report.reporter?.last_name]
    .filter(Boolean)
    .join(" ");

  const targetTypeLabel =
    report.target_type === "company"
      ? t("moderator.report.targetCompany")
      : t("moderator.report.targetTender");
  const openTargetLabel =
    report.target_type === "company"
      ? t("moderator.report.openCompanyPage")
      : t("moderator.report.openTender");
  const statusLabel =
    report.status === "new"
      ? t("moderator.report.statusNew")
      : report.status === "reviewed"
        ? t("moderator.report.statusReviewed")
        : t("moderator.report.statusDismissed");

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" />
            {targetTypeLabel}: {report.targetLabel}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {report.escalated ? (
              <Badge variant="destructive">
                {t("moderator.report.escalationBadge", { count: REPORT_ESCALATION_THRESHOLD })}
              </Badge>
            ) : null}
            {report.initiated_by_staff ? (
              <Badge variant="outline" className="border-primary/40 text-primary">
                {t("moderator.report.fromModerator")}
              </Badge>
            ) : null}
            <Badge variant={report.status === "new" ? "destructive" : "secondary"}>{statusLabel}</Badge>
          </div>
        </div>
        <CardDescription>
          {format(new Date(report.created_at), "d MMM yyyy, HH:mm", { locale: dateLocale })}
          {reporterName ? t("moderator.report.fromReporter", { name: reporterName }) : ""}
          {report.reporter?.phone ? ` · ${report.reporter.phone}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm line-clamp-2">
          <span className="font-medium">{t("moderator.report.reason")}</span> {report.reason}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" onClick={() => onOpen(report.id)}>
            {t("moderator.report.openReport")}
          </Button>
          {report.targetHref ? (
            <Button variant="outline" size="sm" asChild>
              <Link to={report.targetHref} target="_blank" rel="noreferrer">
                {openTargetLabel}
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ModeratorWorkspace() {
  const { t } = useTranslation("common");
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, signOut, updateProfile } = useAuth();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<ModTab>(
    MOD_TABS.includes(tabParam as ModTab) ? (tabParam as ModTab) : "reports",
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const syncedProfileIdRef = useRef<string | null>(null);
  const [savedBaseline, setSavedBaseline] = useState({ firstName: "", lastName: "", phone: "", city: "" });

  const isSettingsDirty = useMemo(() => {
    const cur = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      city: city.trim(),
    };
    return (
      cur.firstName !== savedBaseline.firstName ||
      cur.lastName !== savedBaseline.lastName ||
      cur.phone !== savedBaseline.phone ||
      cur.city !== savedBaseline.city
    );
  }, [firstName, lastName, phone, city, savedBaseline]);

  useEffect(() => {
    if (!profile) {
      syncedProfileIdRef.current = null;
      return;
    }
    if (syncedProfileIdRef.current === profile.id) return;
    syncedProfileIdRef.current = profile.id;
    const snap = {
      firstName: (profile.first_name ?? "").trim(),
      lastName: (profile.last_name ?? "").trim(),
      phone: normalizeKzPhone((profile.phone ?? "").trim()) ?? (profile.phone ?? "").trim(),
      city: (profile.city ?? "").trim(),
    };
    setSavedBaseline(snap);
    setFirstName(snap.firstName);
    setLastName(snap.lastName);
    setPhone(snap.phone);
    setCity(snap.city);
  }, [profile]);

  const { data: pending = [], isLoading: pendingLoading } = usePendingCompaniesForModeration();
  const { data: newReports = [], isLoading: newReportsLoading } = useModerationReports("new");
  const { data: archiveReports = [], isLoading: archiveLoading } = useModerationReports("archive");

  useEffect(() => {
    if (tabParam && MOD_TABS.includes(tabParam as ModTab)) {
      setActiveTab(tabParam as ModTab);
    }
  }, [tabParam]);

  const switchTab = (tab: ModTab, extra?: Record<string, string>) => {
    setActiveTab(tab);
    setSearchParams({ tab, ...extra }, { replace: true });
  };

  const openReport = (id: string) => {
    switchTab("report-detail", { reportId: id });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSaveProfile = async () => {
    const parsed = profileSettingsSchema.safeParse({
      firstName,
      lastName,
      phone,
      city,
      avatarUrl: "",
    });
    const err = firstZodError(parsed);
    if (err) {
      toast.error(err);
      return;
    }
    if (!parsed.success) return;

    setIsSaving(true);
    try {
      await updateProfile({
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        phone: parsed.data.phone,
        city: parsed.data.city,
      });
      setSavedBaseline({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone,
        city: parsed.data.city,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const newReportsCount = newReports.length;
  const roleLabel =
    profile?.role === "moderator" || profile?.role === "admin"
      ? t(`moderator.workspace.roles.${profile.role}`)
      : t("moderator.workspace.defaultName");

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || t("moderator.workspace.defaultName");

  return (
    <>
      <PageHero
        eyebrow={t("moderator.workspace.eyebrow")}
        eyebrowIcon={Shield}
        title={displayName}
        description={roleLabel}
        compact
      />

      <PageContent className="border-b-0">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <aside className="w-full md:w-72 shrink-0 space-y-6">
          <div className="bg-card/90 backdrop-blur rounded-2xl p-6 border border-border/60 text-center shadow-sm">
            <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-background shadow-md">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                {firstName?.charAt(0) || "M"}
              </AvatarFallback>
            </Avatar>
            <h2 className="font-bold text-xl mb-1 line-clamp-1">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-sm text-muted-foreground mb-2 font-medium">{roleLabel}</p>
            <Badge variant="outline" className="mb-4 gap-1">
              <Shield className="h-3 w-3" />
              {t("moderator.workspace.eyebrow")}
            </Badge>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("signOut")}
            </Button>
          </div>

          <nav className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={() => switchTab("reports")}
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                activeTab === "reports" || activeTab === "report-detail"
                  ? "bg-primary text-primary-foreground font-semibold shadow-md"
                  : "hover:bg-muted font-medium"
              }`}
            >
              <span className="flex items-center">
                <Flag className="h-5 w-5 mr-3" />
                {t("moderator.workspace.nav.reports")}
              </span>
              {newReportsCount > 0 ? (
                <Badge variant="destructive" className="rounded-full">
                  {newReportsCount}
                </Badge>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => switchTab("reports-archive")}
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                activeTab === "reports-archive"
                  ? "bg-primary text-primary-foreground font-semibold shadow-md"
                  : "hover:bg-muted font-medium"
              }`}
            >
              <span className="flex items-center">
                <Archive className="h-5 w-5 mr-3" />
                {t("moderator.workspace.nav.reportsArchive")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => switchTab("journal")}
              className={`flex items-center px-4 py-3.5 rounded-xl transition-all ${
                activeTab === "journal"
                  ? "bg-primary text-primary-foreground font-semibold shadow-md"
                  : "hover:bg-muted font-medium"
              }`}
            >
              <ScrollText className="h-5 w-5 mr-3" />
              {t("moderator.workspace.nav.journal")}
            </button>
            <button
              type="button"
              onClick={() => switchTab("verification")}
              className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                activeTab === "verification"
                  ? "bg-primary text-primary-foreground font-semibold shadow-md"
                  : "hover:bg-muted font-medium"
              }`}
            >
              <span className="flex items-center">
                <Building2 className="h-5 w-5 mr-3" />
                {t("moderator.workspace.nav.verification")}
              </span>
              {pending.length > 0 ? (
                <Badge variant={activeTab === "verification" ? "secondary" : "destructive"}>
                  {pending.length}
                </Badge>
              ) : null}
            </button>
            <Link
              to="/contracts"
              className="flex items-center px-4 py-3.5 rounded-xl transition-all hover:bg-muted font-medium text-foreground"
            >
              <Scale className="h-5 w-5 mr-3 shrink-0" />
              {t("moderator.workspace.nav.contractTemplates")}
            </Link>
            <button
              type="button"
              onClick={() => switchTab("settings")}
              className={`flex items-center px-4 py-3.5 rounded-xl transition-all ${
                activeTab === "settings"
                  ? "bg-primary text-primary-foreground font-semibold shadow-md"
                  : "hover:bg-muted font-medium"
              }`}
            >
              <SettingsIcon className="h-5 w-5 mr-3" />
              {t("moderator.workspace.nav.settings")}
            </button>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <NotificationsPanel />
          {activeTab === "report-detail" && <ModerationReportDetail />}

          {activeTab === "reports" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{t("moderator.workspace.reports.title")}</h2>
                <p className="text-muted-foreground">{t("moderator.workspace.reports.desc")}</p>
              </div>

              <Alert>
                <AlertTitle>{t("moderator.workspace.reports.actionsTitle")}</AlertTitle>
                <AlertDescription className="space-y-2 text-sm">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <Trans
                        ns="common"
                        i18nKey="moderator.workspace.reports.actionsGuide.closeWithoutSanctions"
                        components={{ strong: <strong /> }}
                      />
                    </li>
                    <li>
                      <Trans
                        ns="common"
                        i18nKey="moderator.workspace.reports.actionsGuide.warning"
                        components={{ strong: <strong /> }}
                      />
                    </li>
                    <li>
                      <Trans
                        ns="common"
                        i18nKey="moderator.workspace.reports.actionsGuide.dismiss"
                        components={{ strong: <strong /> }}
                      />
                    </li>
                    <li>
                      <Trans
                        ns="common"
                        i18nKey="moderator.workspace.reports.actionsGuide.ban"
                        components={{ strong: <strong /> }}
                      />
                    </li>
                    <li>
                      <Trans
                        ns="common"
                        i18nKey="moderator.workspace.reports.actionsGuide.escalation"
                        values={{ count: REPORT_ESCALATION_THRESHOLD }}
                        components={{ strong: <strong /> }}
                      />
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>

              {newReportsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : newReports.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    {t("moderator.workspace.reports.empty")}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {newReports.map((r) => (
                    <ReportCard key={r.id} report={r} onOpen={openReport} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "reports-archive" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{t("moderator.workspace.archive.title")}</h2>
                <p className="text-muted-foreground">{t("moderator.workspace.archive.desc")}</p>
              </div>

              {archiveLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : archiveReports.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    {t("moderator.workspace.archive.empty")}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {archiveReports.map((r) => (
                    <ReportCard key={r.id} report={r} onOpen={openReport} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "journal" && <ModerationJournalPanel />}

          {activeTab === "verification" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{t("moderator.workspace.verification.title")}</h2>
                <p className="text-muted-foreground">{t("moderator.workspace.verification.desc")}</p>
              </div>

              {pendingLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pending.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    {t("moderator.workspace.verification.empty")}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pending.map((c) => {
                    const owner = c.owner;
                    const ownerName =
                      [owner?.first_name, owner?.last_name].filter(Boolean).join(" ") || t("emDash");
                    return (
                      <ModerationCompanyCard
                        key={c.id}
                        companyId={c.id}
                        companyName={c.name}
                        city={c.city}
                        category={c.category}
                        submittedAt={c.verification_submitted_at}
                        ownerName={ownerName}
                        ownerPhone={owner?.phone ?? null}
                        companyBin={c.bin ?? null}
                        moderatorProfileId={profile!.id}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">{t("moderator.workspace.settings.title")}</h2>
                <p className="text-muted-foreground">{t("moderator.workspace.settings.desc")}</p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>{t("moderator.workspace.settings.personalData")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mod-first">{t("moderator.workspace.settings.firstName")}</Label>
                      <Input
                        id="mod-first"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mod-last">{t("moderator.workspace.settings.lastName")}</Label>
                      <Input
                        id="mod-last"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mod-email">{t("moderator.workspace.settings.email")}</Label>
                    <Input id="mod-email" value={user?.email || ""} disabled className="rounded-xl bg-muted" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mod-phone">{t("moderator.workspace.settings.phone")}</Label>
                      <Input
                        id="mod-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mod-city">{t("city")}</Label>
                      <SearchableCitySelect
                        id="mod-city"
                        cities={KAZAKHSTAN_CITIES}
                        value={city}
                        onChange={setCity}
                      />
                    </div>
                  </div>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    <Trans
                      ns="common"
                      i18nKey="moderator.workspace.settings.roleNote"
                      values={{ role: roleLabel }}
                      components={{ strong: <strong /> }}
                    />
                  </p>
                  <Button className="rounded-xl" disabled={isSaving || !isSettingsDirty} onClick={() => void handleSaveProfile()}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {t("saveBtn")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
      </PageContent>
    </>
  );
}
