import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Archive,
  Building2,
  Flag,
  Loader2,
  LogOut,
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
import { STAFF_ROLE_LABELS } from "@/lib/userRoles";
import {
  reportOpenTargetLabel,
  reportTargetTypeLabel,
  REPORT_ESCALATION_THRESHOLD,
} from "@/lib/moderationLabels";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingCompaniesForModeration } from "@/hooks/useCompanyVerification";
import { useModerationReports, type ModerationReportRow } from "@/hooks/useModerationReports";
import { ModerationCompanyCard } from "@/components/moderator/ModerationCompanyCard";
import { ModerationJournalPanel } from "@/components/moderator/ModerationJournalPanel";
import { ModerationReportDetail } from "@/components/moderator/ModerationReportDetail";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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
  const reporterName = [report.reporter?.first_name, report.reporter?.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" />
            {reportTargetTypeLabel(report.target_type)}: {report.targetLabel}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {report.escalated ? (
              <Badge variant="destructive">Эскалация · {REPORT_ESCALATION_THRESHOLD}+ жалоб</Badge>
            ) : null}
            {report.initiated_by_staff ? (
              <Badge variant="outline" className="border-primary/40 text-primary">
                От модератора
              </Badge>
            ) : null}
            <Badge variant={report.status === "new" ? "destructive" : "secondary"}>
              {report.status === "new"
                ? "Новая"
                : report.status === "reviewed"
                  ? "Меры приняты"
                  : "Необоснована"}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {format(new Date(report.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
          {reporterName ? ` · от ${reporterName}` : ""}
          {report.reporter?.phone ? ` · ${report.reporter.phone}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm line-clamp-2">
          <span className="font-medium">Причина:</span> {report.reason}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" onClick={() => onOpen(report.id)}>
            Открыть жалобу
          </Button>
          {report.targetHref ? (
            <Button variant="outline" size="sm" asChild>
              <Link to={report.targetHref} target="_blank" rel="noreferrer">
                {reportOpenTargetLabel(report.target_type)}
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ModeratorWorkspace() {
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

  const { data: pending = [], isLoading: pendingLoading } = usePendingCompaniesForModeration();
  const { data: newReports = [], isLoading: newReportsLoading } = useModerationReports("new");
  const { data: archiveReports = [], isLoading: archiveLoading } = useModerationReports("archive");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
      setCity(profile.city || "");
    }
  }, [profile]);

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
    setIsSaving(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        city,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const newReportsCount = newReports.length;
  const roleLabel =
    profile?.role && profile.role in STAFF_ROLE_LABELS
      ? STAFF_ROLE_LABELS[profile.role as keyof typeof STAFF_ROLE_LABELS]
      : "Модератор";

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <aside className="w-full md:w-72 shrink-0 space-y-6">
          <div className="bg-card rounded-2xl p-6 border text-center shadow-sm">
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
              Кабинет модератора
            </Badge>
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Выйти
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
                Жалобы
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
                Архив жалоб
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
              Журнал
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
                Верификация
              </span>
              {pending.length > 0 ? (
                <Badge variant={activeTab === "verification" ? "secondary" : "destructive"}>
                  {pending.length}
                </Badge>
              ) : null}
            </button>
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
              Настройки
            </button>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <NotificationsPanel />
          {activeTab === "report-detail" && <ModerationReportDetail />}

          {activeTab === "reports" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Новые жалобы</h2>
                <p className="text-muted-foreground">
                  Только необработанные — после решения жалоба уходит в архив
                </p>
              </div>

              <Alert>
                <AlertTitle>Действия модератора</AlertTitle>
                <AlertDescription className="space-y-2 text-sm">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Закрыть без санкций</strong> — жалоба уходит в архив как «Меры приняты», объект
                      (компания/тендер) не меняется. Используйте, если вы уже связались с сторонами или санкции не
                      нужны.
                    </li>
                    <li>
                      <strong>Предупреждение владельцу</strong> — уведомление в кабинете: исправить описание,
                      тендер и т.д. Без скрытия и без бана.
                    </li>
                    <li>
                      <strong>Жалоба необоснована</strong> — сигнал отклонён, объект не трогаем.
                    </li>
                    <li>
                      <strong>Бан / снять блокировку</strong> — временный запрет входа; при необходимости бан
                      можно отменить кнопкой «Снять блокировку».
                    </li>
                    <li>
                      При <strong>{REPORT_ESCALATION_THRESHOLD}+ жалобах</strong> на один объект — бейдж эскалации.
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
                  <CardContent className="py-12 text-center text-muted-foreground">Новых жалоб нет</CardContent>
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
                <h2 className="text-2xl font-bold">Архив жалоб</h2>
                <p className="text-muted-foreground">Обработанные и отклонённые — не отображаются в очереди новых</p>
              </div>

              {archiveLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : archiveReports.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">Архив пуст</CardContent>
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
                <h2 className="text-2xl font-bold">Верификация компаний</h2>
                <p className="text-muted-foreground">Проверка документов перед публикацией в каталоге</p>
              </div>

              {pendingLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pending.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Нет заявок на проверке компаний
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pending.map((c) => {
                    const owner = c.owner;
                    const ownerName =
                      [owner?.first_name, owner?.last_name].filter(Boolean).join(" ") || "—";
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
                <h2 className="text-2xl font-bold">Настройки</h2>
                <p className="text-muted-foreground">Контакты модератора для служебной связи</p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Личные данные</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mod-first">Имя</Label>
                      <Input
                        id="mod-first"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mod-last">Фамилия</Label>
                      <Input
                        id="mod-last"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mod-email">Email</Label>
                    <Input id="mod-email" value={user?.email || ""} disabled className="rounded-xl bg-muted" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mod-phone">Телефон</Label>
                      <Input
                        id="mod-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mod-city">Город</Label>
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
                    Роль аккаунта: <strong>{roleLabel}</strong>. Смена роли недоступна для модераторов.
                  </p>
                  <Button className="rounded-xl" disabled={isSaving} onClick={() => void handleSaveProfile()}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Сохранить
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
