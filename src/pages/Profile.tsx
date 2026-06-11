import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Building2, MessageSquare, Star, LogOut, Loader2, Plus, Upload, Settings as SettingsIcon, Trash2, FileText, MapPin, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { SearchableCitySelect } from "@/components/SearchableCitySelect";
import { KAZAKHSTAN_CITIES, type TenderTypeValue } from "@/lib/constants";
import { useMyTenders, useUpdateTender, type TenderStatus } from "@/hooks/useTenders";
import { useAuth } from "@/contexts/AuthContext";
import { useRequests, useDeleteRequest } from "@/hooks/useRequests";
import { canDeleteRequest } from "@/lib/requestWorkflow";
import { useInboxCounts } from "@/hooks/useInboxCounts";
import { useRequestChatSummaries } from "@/hooks/useRequestChatSummaries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompanies } from "@/hooks/useServices";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays } from "date-fns";
import { useDateFnsLocale } from "@/hooks/useAppFormat";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TenderResponsesPanel } from "@/components/TenderResponsesPanel";
import { TenderOwnerStatusSelect } from "@/components/TenderOwnerStatusSelect";
import { getRequestDisplay, isRequestIncoming } from "@/lib/requestDisplay";
import { getOnboardingIntent } from "@/lib/onboarding";
import { isStaffRole } from "@/lib/userRoles";
import { useUserRoleLabel, useTenderTypeLabel } from "@/lib/i18nCatalog";
import { ModeratorWorkspace } from "@/components/moderator/ModeratorWorkspace";
import { PageHero, PageContent } from "@/components/layout/PageHero";
import {
  canCorrectIdentityName,
  identityCorrectionExpiresAt,
  isIdentityLocked,
  isIdentityNameEditable,
  isIdentityPhoneEditable,
} from "@/lib/profileIdentity";
import { parseProfileSettingsSave } from "@/lib/validation";
import { translateValidationError } from "@/lib/validation/translateError";
import { formatKzPhoneDisplay, normalizeKzPhone } from "@/lib/phone";
const PROFILE_TABS = ["requests", "tenders", "companies", "reviews", "settings"] as const;

type ProfileFormSnapshot = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  avatarUrl: string;
};

function snapshotFromProfile(p: {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
}): ProfileFormSnapshot {
  const rawPhone = (p.phone ?? "").trim();
  const normalizedPhone = normalizeKzPhone(rawPhone) ?? rawPhone;
  return {
    firstName: (p.first_name ?? "").trim(),
    lastName: (p.last_name ?? "").trim(),
    phone: normalizedPhone,
    city: (p.city ?? "").trim(),
    avatarUrl: p.avatar_url ?? "",
  };
}

function snapshotsEqual(a: ProfileFormSnapshot, b: ProfileFormSnapshot): boolean {
  return (
    a.firstName === b.firstName &&
    a.lastName === b.lastName &&
    a.phone === b.phone &&
    a.city === b.city &&
    a.avatarUrl === b.avatarUrl
  );
}

const Profile = () => {
  const { t } = useTranslation(["profile", "common", "validation", "catalogData"]);
  const dateFnsLocale = useDateFnsLocale();
  const roleLabelFn = useUserRoleLabel();
  const tenderTypeLabel = useTenderTypeLabel();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, isLoading: authLoading, signOut, updateProfile } = useAuth();
  const { data: requests, isLoading: requestsLoading } = useRequests();
  const { data: inbox } = useInboxCounts();
  const { data: chatSummaries } = useRequestChatSummaries();
  const deleteRequest = useDeleteRequest();
  const { data: myCompanies, isLoading: companiesLoading } = useMyCompanies(profile?.id);
  const { data: myTenders, isLoading: tendersLoading } = useMyTenders(profile?.id);
  const updateTender = useUpdateTender();
  const { uploadImage, isUploading } = useImageUpload();

  const [activeTab, setActiveTab] = useState("requests");
  const [requestsScope, setRequestsScope] = useState<"all" | "incoming" | "outgoing">("all");
  const [requestsLifecycle, setRequestsLifecycle] = useState<"active" | "archive">("active");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<"client" | "contractor" | "supplier">("client");
  const [roleRiskAccepted, setRoleRiskAccepted] = useState(false);
  const [rolePhrase, setRolePhrase] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);

  const companyCount = myCompanies?.length ?? 0;
  const openTenderCount = useMemo(
    () => myTenders?.filter((t) => t.status === "open").length ?? 0,
    [myTenders],
  );
  const activeTenderCount = useMemo(
    () => myTenders?.filter((t) => t.status === "open" || t.status === "in_progress").length ?? 0,
    [myTenders],
  );
  const showCreateCompanyNudge =
    getOnboardingIntent() === "create_company" && !companiesLoading && companyCount === 0;

  // Fetch my reviews
  const { data: myReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["my-reviews", profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select(`*, company:companies(name)`)
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile,
  });

  const syncedProfileIdRef = useRef<string | null>(null);
  const [savedBaseline, setSavedBaseline] = useState<ProfileFormSnapshot | null>(null);

  const currentFormSnapshot = useMemo(
    (): ProfileFormSnapshot => ({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      avatarUrl,
    }),
    [firstName, lastName, phone, city, avatarUrl],
  );

  const isSettingsDirty = useMemo(() => {
    if (!savedBaseline) return false;
    return !snapshotsEqual(savedBaseline, currentFormSnapshot);
  }, [savedBaseline, currentFormSnapshot]);

  // Sync form once per profile тАФ ╨╜╨╡ ╨╖╨░╤В╨╕╤А╨░╨╡╨╝ ╤З╨╡╤А╨╜╨╛╨▓╨╕╨║ ╨┐╤А╨╕ TOKEN_REFRESHED (╤Б╨╝╨╡╨╜╨░ ╨▓╨║╨╗╨░╨┤╨║╨╕)
  useEffect(() => {
    if (!profile) {
      syncedProfileIdRef.current = null;
      setSavedBaseline(null);
      return;
    }
    if (syncedProfileIdRef.current === profile.id) return;
    syncedProfileIdRef.current = profile.id;
    const snap = snapshotFromProfile(profile);
    setSavedBaseline(snap);
    setFirstName(snap.firstName);
    setLastName(snap.lastName);
    setPhone(snap.phone);
    setCity(snap.city);
    setAvatarUrl(snap.avatarUrl);
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) {
      const defaultTab = isStaffRole(profile?.role) ? "reports" : "requests";
      navigate(`/profile?tab=${defaultTab}`, { replace: true });
      return;
    }
    if (PROFILE_TABS.includes(tab as (typeof PROFILE_TABS)[number])) {
      setActiveTab(tab);
    }
  }, [searchParams, navigate, profile?.role]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isStaffRole(profile?.role)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <ModeratorWorkspace />
      </div>
    );
  }

  const handleSaveProfile = async () => {
    const namesEditable = isIdentityNameEditable(profile);
    const phoneEditable = isIdentityPhoneEditable(profile);

    const parsed = parseProfileSettingsSave({
      firstName: namesEditable ? firstName : (profile?.first_name ?? "").trim(),
      lastName: namesEditable ? lastName : (profile?.last_name ?? "").trim(),
      phone: phoneEditable ? phone : (savedBaseline?.phone ?? phone),
      city,
      avatarUrl,
      namesEditable,
      phoneEditable,
    });

    if (!parsed.success) {
      toast.error(translateValidationError(parsed.error, t));
      return;
    }

    setIsSaving(true);
    try {
      const payload: {
        first_name?: string;
        last_name?: string;
        phone?: string;
        city: string;
        avatar_url: string | null;
      } = {
        city: parsed.data.city,
        avatar_url: parsed.data.avatarUrl?.trim() || null,
      };

      if (phoneEditable && parsed.data.phone) {
        payload.phone = parsed.data.phone;
      }

      if (namesEditable) {
        payload.first_name = parsed.data.firstName;
        payload.last_name = parsed.data.lastName;
      }

      await updateProfile(payload);

      const savedSnap: ProfileFormSnapshot = {
        firstName: namesEditable ? parsed.data.firstName : (profile?.first_name ?? "").trim(),
        lastName: namesEditable ? parsed.data.lastName : (profile?.last_name ?? "").trim(),
        phone: phoneEditable ? parsed.data.phone : snapshotFromProfile(profile!).phone,
        city: parsed.data.city,
        avatarUrl: parsed.data.avatarUrl?.trim() || "",
      };
      setSavedBaseline(savedSnap);
      if (namesEditable) {
        setFirstName(savedSnap.firstName);
        setLastName(savedSnap.lastName);
      }
      if (phoneEditable) {
        setPhone(savedSnap.phone);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file, "avatars");
    if (url) {
      setAvatarUrl(url);
    }
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusLabel = (status: string) => {
    const key = `requests.status.${status}` as "requests.status.pending" | "requests.status.accepted" | "requests.status.rejected" | "requests.status.completed";
    if (status === "pending" || status === "accepted" || status === "rejected" || status === "completed") {
      return t(key);
    }
    return status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "accepted": return "bg-primary/10 text-primary";
      case "rejected": return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "completed": return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusHint = (status: string) => {
    const key = `requests.statusHint.${status}` as "requests.statusHint.pending" | "requests.statusHint.accepted" | "requests.statusHint.rejected" | "requests.statusHint.completed";
    if (status === "pending" || status === "accepted" || status === "rejected" || status === "completed") {
      return t(key);
    }
    return "";
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm(t("requests.deleteConfirm"))) {
      return;
    }
    
    try {
      await deleteRequest.mutateAsync(id);
      toast.success(t("requests.deleteSuccess"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("requests.deleteError");
      toast.error(message);
    }
  };

  const requestScopeCounts = useMemo(() => {
    if (!requests?.length || !profile?.id) {
      return { all: 0, incoming: 0, outgoing: 0, active: 0, archive: 0 };
    }
    let incoming = 0;
    let active = 0;
    let archive = 0;
    for (const r of requests) {
      if (isRequestIncoming(r, profile.id)) incoming++;
      if (r.status === "completed" || r.status === "rejected") archive++;
      else active++;
    }
    return {
      all: requests.length,
      incoming,
      outgoing: requests.length - incoming,
      active,
      archive,
    };
  }, [requests, profile?.id]);

  const filteredRequests = useMemo(() => {
    if (!requests?.length) return [];
    let list = requests;
    if (profile?.id && requestsScope !== "all") {
      list = list.filter((r) => {
        const incoming = isRequestIncoming(r, profile.id);
        return requestsScope === "incoming" ? incoming : !incoming;
      });
    }
    list = list.filter((r) => {
      const isArchived = r.status === "completed" || r.status === "rejected";
      return requestsLifecycle === "archive" ? isArchived : !isArchived;
    });
    return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [requests, requestsScope, requestsLifecycle, profile?.id]);

  const cooldownUntil = profile?.last_role_change_at
    ? addDays(new Date(profile.last_role_change_at), 14)
    : null;
  const canChangeRole = !cooldownUntil || cooldownUntil.getTime() <= Date.now();

  const identityLocked = isIdentityLocked(profile);
  const namesEditable = isIdentityNameEditable(profile);
  const phoneEditable = isIdentityPhoneEditable(profile);
  const nameCorrectionAllowed = canCorrectIdentityName(profile);
  const correctionDeadline = identityCorrectionExpiresAt(profile);
  const phoneDisplay = formatKzPhoneDisplay(phone);

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`
    : user?.email?.split("@")[0];
  const roleLabel = roleLabelFn(profile?.role);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageHero eyebrow={t("hero.eyebrow")} title={displayName} description={roleLabel} compact />

      <PageContent className="border-b-0">
        <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
          {/* Sidebar */}
          <div className="w-full md:w-72 shrink-0 space-y-6">
            <div className="bg-card/90 backdrop-blur rounded-2xl p-6 border border-border/60 text-center shadow-sm">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-background shadow-md">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                  {firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-bold text-xl mb-1 line-clamp-1">{displayName}</h2>
              <p className="text-sm text-muted-foreground mb-6 font-medium">{roleLabel}</p>
              <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t("sidebar.signOut")}
              </Button>
            </div>

            <nav className="flex flex-col space-y-2">
              <button 
                onClick={() => setActiveTab("requests")}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
                  activeTab === "requests" 
                  ? "bg-primary text-primary-foreground font-semibold shadow-md" 
                  : "hover:bg-muted text-foreground font-medium"
                }`}
              >
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-3" />
                  {t("sidebar.requestsChats")}
                </div>
                {(inbox?.messages ?? 0) > 0 && (
                  <Badge variant={activeTab === "requests" ? "secondary" : "destructive"} className="rounded-full px-2">
                    {inbox!.messages > 99 ? "99+" : inbox!.messages}
                  </Badge>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab("tenders")}
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all ${
                  activeTab === "tenders"
                    ? "bg-primary text-primary-foreground font-semibold shadow-md"
                    : "hover:bg-muted text-foreground font-medium"
                }`}
              >
                <FileText className="h-5 w-5 mr-3" />
                {t("sidebar.myTenders")}
              </button>

              <button
                onClick={() => setActiveTab("companies")}
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all ${
                  activeTab === "companies"
                    ? "bg-primary text-primary-foreground font-semibold shadow-md"
                    : "hover:bg-muted text-foreground font-medium"
                }`}
              >
                <Building2 className="h-5 w-5 mr-3" />
                {t("sidebar.myCompanies")}
              </button>

              <button 
                onClick={() => setActiveTab("reviews")}
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all ${
                  activeTab === "reviews" 
                  ? "bg-primary text-primary-foreground font-semibold shadow-md" 
                  : "hover:bg-muted text-foreground font-medium"
                }`}
              >
                <Star className="h-5 w-5 mr-3" />
                {t("sidebar.myReviews")}
              </button>

              <Link
                to="/contracts"
                className="flex items-center px-4 py-3.5 rounded-xl transition-all hover:bg-muted text-foreground font-medium"
              >
                <ScrollText className="h-5 w-5 mr-3 shrink-0" />
                {t("sidebar.contractTemplates")}
              </Link>

              <button 
                onClick={() => setActiveTab("settings")}
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all ${
                  activeTab === "settings" 
                  ? "bg-primary text-primary-foreground font-semibold shadow-md" 
                  : "hover:bg-muted text-foreground font-medium"
                }`}
              >
                <SettingsIcon className="h-5 w-5 mr-3" />
                {t("sidebar.settings")}
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "requests" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{t("requests.title")}</h2>
                  <p className="text-muted-foreground">{t("requests.subtitle")}</p>
                  <p className="text-xs text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                    <Trans i18nKey="requests.hint" ns="profile" components={{ strong: <strong /> }} />
                  </p>
                </div>
                
                <div className="space-y-4">
                  {requestsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-48 mb-2" /><Skeleton className="h-4 w-32" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                      </Card>
                    ))
                  ) : !requests?.length ? (
                    <Card className="border-dashed border-2 bg-muted/10">
                      <CardContent className="flex flex-col items-center text-center py-16">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">{t("requests.emptyTitle")}</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                          {t("requests.emptyDesc")}
                        </p>
                        <Button onClick={() => navigate("/catalog")} className="rounded-xl shadow-md">
                          <Plus className="h-4 w-4 mr-2" />
                          {t("requests.goToCatalog")}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <ToggleGroup
                        type="single"
                        value={requestsScope}
                        onValueChange={(v) => {
                          if (v === "all" || v === "incoming" || v === "outgoing") setRequestsScope(v);
                        }}
                        className="justify-start flex-wrap gap-1.5 p-1 rounded-xl bg-muted/40 border w-full sm:w-auto"
                        variant="outline"
                      >
                        <ToggleGroupItem value="all" aria-label={t("requests.scopeAll")} className="rounded-lg px-3 sm:px-4 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:border-border">
                          {t("requests.scopeAll")} ({requestScopeCounts.all})
                        </ToggleGroupItem>
                        <ToggleGroupItem value="incoming" aria-label={t("requests.scopeIncoming")} className="rounded-lg px-3 sm:px-4 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:border-border">
                          {t("requests.scopeIncoming")} ({requestScopeCounts.incoming})
                        </ToggleGroupItem>
                        <ToggleGroupItem value="outgoing" aria-label={t("requests.scopeOutgoing")} className="rounded-lg px-3 sm:px-4 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:border-border">
                          {t("requests.scopeOutgoing")} ({requestScopeCounts.outgoing})
                        </ToggleGroupItem>
                      </ToggleGroup>

                      <ToggleGroup
                        type="single"
                        value={requestsLifecycle}
                        onValueChange={(v) => {
                          if (v === "active" || v === "archive") setRequestsLifecycle(v);
                        }}
                        className="justify-start flex-wrap gap-1.5 p-1 rounded-xl bg-muted/40 border w-full sm:w-auto"
                        variant="outline"
                      >
                        <ToggleGroupItem value="active" className="rounded-lg px-3 sm:px-4 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                          {t("requests.lifecycleActive")} ({requestScopeCounts.active})
                        </ToggleGroupItem>
                        <ToggleGroupItem value="archive" className="rounded-lg px-3 sm:px-4 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                          {t("requests.lifecycleArchive")} ({requestScopeCounts.archive})
                        </ToggleGroupItem>
                      </ToggleGroup>

                      {filteredRequests.length === 0 ? (
                        <Card className="border-dashed border-2 bg-muted/10">
                          <CardContent className="flex flex-col items-center text-center py-12">
                            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <h3 className="font-semibold mb-1">{t("requests.filterEmptyTitle")}</h3>
                            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                              {requestsLifecycle === "archive"
                                ? t("requests.filterEmptyArchive")
                                : requestsScope === "incoming"
                                ? t("requests.filterEmptyIncoming")
                                : t("requests.filterEmptyOutgoing")}
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {requestsLifecycle === "active" && requestScopeCounts.archive > 0 ? (
                                <Button variant="outline" className="rounded-xl" onClick={() => setRequestsLifecycle("archive")}>
                                  {t("requests.openArchive", { count: requestScopeCounts.archive })}
                                </Button>
                              ) : null}
                              <Button variant="outline" className="rounded-xl" onClick={() => { setRequestsScope("all"); setRequestsLifecycle("active"); }}>
                                {t("requests.resetFilters")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        filteredRequests.map((request) => {
                      if (!profile?.id) return null;
                      const display = getRequestDisplay(request, profile.id);
                      const isIncoming = display.direction === "incoming";
                      const summary = chatSummaries?.[request.id];
                      const unread = summary?.unreadFromOthers ?? 0;
                      const lastPreview = summary?.lastMessage?.preview?.trim() || "";
                      const isArchived = request.status === "completed" || request.status === "rejected";
                      
                      return (
                        <Card
                          key={request.id}
                          className={cn(
                            "hover-lift border-2 transition-all overflow-hidden group",
                            isArchived
                              ? "border-border/60 bg-muted/20 opacity-90"
                              : unread > 0
                              ? "border-primary/50 shadow-md shadow-primary/10 bg-primary/[0.04]"
                              : "border-transparent hover:border-primary/20",
                          )}
                        >
                          <CardHeader className={cn("pb-4", isArchived ? "bg-muted/20" : "bg-muted/30")}>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="flex items-center gap-3">
                                {(isIncoming || request.recipient_profile_id) && (
                                  <Avatar className="h-10 w-10 border shadow-sm">
                                    <AvatarImage src={display.avatarUrl || ""} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                      {display.avatarFallback}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <CardTitle className="text-lg">{display.title}</CardTitle>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 h-4">
                                      {isIncoming ? t("requests.incoming") : t("requests.outgoing")}
                                    </Badge>
                                    {unread > 0 ? (
                                      <Badge className="rounded-full px-2 py-0 text-[10px] h-5">
                                        {t("requests.unread", { count: unread > 99 ? "99+" : unread })}
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <CardDescription className="text-sm font-medium text-foreground">{request.title}</CardDescription>
                                  {display.subtitle ? (
                                    <p className="text-xs text-muted-foreground mt-1">{display.subtitle}</p>
                                  ) : null}
                                </div>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-help ${getStatusColor(request.status)}`}>
                                    {getStatusLabel(request.status)}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-left">
                                  {getStatusHint(request.status)}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm text-muted-foreground">
                                {t("requests.createdAt", { date: format(new Date(request.created_at), "d MMM yyyy", { locale: dateFnsLocale }) })}
                              </span>
                              {!isArchived ? (
                                <>
                              <span className="text-xs text-muted-foreground mt-1">{t("requests.lastInChat")}</span>
                              <span className="text-sm text-foreground line-clamp-2 mt-0.5 max-w-xl break-words">
                                {lastPreview || t("requests.noMessagesYet")}
                              </span>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground mt-1">
                                  {request.status === "completed" ? t("requests.dealCompleted") : t("requests.requestClosed")}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              {canDeleteRequest(request.status) ? (
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                onClick={() => handleDeleteRequest(request.id)}
                                disabled={deleteRequest.isPending}
                                title={t("requests.deleteTitle")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              ) : null}
                              <Button onClick={() => navigate(`/chat/${request.id}`)} variant={isArchived ? "outline" : "default"} className="rounded-xl shadow-sm group-hover:bg-primary/90 transition-colors">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                {isArchived ? t("requests.open") : t("requests.openChat")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tenders" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{t("tenders.title")}</h2>
                    <p className="text-muted-foreground">
                      {t("tenders.subtitle")}
                    </p>
                  </div>
                  <Button className="rounded-xl" onClick={() => navigate("/tenders")}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("tenders.create")}
                  </Button>
                </div>

                {tendersLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-64" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-10 w-full" />
                      </CardContent>
                    </Card>
                  ))
                ) : !myTenders?.length ? (
                  <Card className="border-dashed border-2 bg-muted/10">
                    <CardContent className="flex flex-col items-center text-center py-16">
                      <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <h3 className="font-semibold text-lg mb-2">{t("tenders.emptyTitle")}</h3>
                      <p className="text-muted-foreground mb-6 max-w-sm">
                        {t("tenders.emptyDesc")}
                      </p>
                      <Button onClick={() => navigate("/tenders")} className="rounded-xl">
                        {t("tenders.goToTenders")}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {myTenders.map((tender) => (
                      <Card key={tender.id} className="hover-lift">
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <CardTitle className="text-lg line-clamp-1">{tender.title}</CardTitle>
                              <CardDescription className="line-clamp-2 mt-1">{tender.description}</CardDescription>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {tenderTypeLabel((tender.tender_type || "subcontract") as TenderTypeValue) || t("other", { ns: "common" })}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {tender.city ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {tender.city}
                              </span>
                            ) : null}
                            <span>
                              {t("tenders.createdAt", { date: format(new Date(tender.created_at), "d MMM yyyy", { locale: dateFnsLocale }) })}
                            </span>
                          </div>
                          <div className="max-w-md">
                            <TenderOwnerStatusSelect
                              tenderId={tender.id}
                              tenderTitle={tender.title}
                              status={tender.status}
                              label={t("tenders.statusLabel")}
                              disabled={updateTender.isPending}
                              onStatusChange={(v) =>
                                updateTender.mutate(
                                  { id: tender.id, status: v },
                                  {
                                    onSuccess: () => toast.success(t("tenders.statusUpdated")),
                                    onError: () => toast.error(t("tenders.statusUpdateError")),
                                  },
                                )
                              }
                            />
                          </div>
                          <TenderResponsesPanel
                            tenderId={tender.id}
                            tenderTitle={tender.title}
                            tenderStatus={tender.status}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "companies" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{t("companies.title")}</h2>
                    <p className="text-muted-foreground">{t("companies.subtitle")}</p>
                  </div>
                  <Button onClick={() => navigate("/create-company")} className="rounded-xl shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("companies.create")}
                  </Button>
                </div>

                {showCreateCompanyNudge ? (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-foreground">
                        {t("companies.nudge")}
                      </p>
                      <Button className="rounded-xl shrink-0" onClick={() => navigate("/create-company")}>
                        {t("companies.createCompany")}
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companiesLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                      </Card>
                    ))
                  ) : myCompanies && myCompanies.length > 0 ? (
                    myCompanies.map((company) => (
                      <Card key={company.id} className="hover-lift border-2 border-transparent hover:border-primary/20 transition-all flex flex-col">
                        <CardHeader>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                              {company.logo_url ? (
                                <img src={company.logo_url} alt={t("companies.logoAlt")} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                <Building2 className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-lg truncate">{company.name}</CardTitle>
                              <CardDescription className="truncate">{company.category}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="mt-auto pt-0">
                          <Button variant="secondary" className="w-full rounded-xl" onClick={() => navigate(`/company/${company.id}`)}>
                            {t("companies.openProfile")}
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full">
                      <Card className="border-dashed border-2 bg-muted/10">
                        <CardContent className="flex flex-col items-center text-center py-12">
                          <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                          <h3 className="font-semibold text-lg mb-2">{t("companies.emptyTitle")}</h3>
                          <p className="text-muted-foreground mb-6 max-w-md">
                            {t("companies.emptyDesc")}
                          </p>
                          <Button onClick={() => navigate("/create-company")} className="rounded-xl">
                            <Plus className="h-4 w-4 mr-2" />
                            {t("companies.registerCompany")}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{t("reviews.title")}</h2>
                  <p className="text-muted-foreground">{t("reviews.subtitle")}</p>
                </div>
                
                <div className="space-y-4">
                  {reviewsLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-48 mb-2" /><Skeleton className="h-4 w-32" /></CardHeader>
                        <CardContent><Skeleton className="h-16 w-full" /></CardContent>
                      </Card>
                    ))
                  ) : myReviews && myReviews.length > 0 ? (
                    myReviews.map((review: any) => (
                      <Card key={review.id}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base font-semibold">
                                {t("reviews.reviewOn")} <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate(`/company/${review.company_id}`)}>{review.company?.name}</span>
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {format(new Date(review.created_at), "d MMMM yyyy", { locale: dateFnsLocale })}
                              </CardDescription>
                            </div>
                            <div className="flex bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground/30"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </CardHeader>
                        {review.comment && (
                          <CardContent>
                            <p className="text-muted-foreground bg-muted/30 p-4 rounded-xl italic">
                              "{review.comment}"
                            </p>
                          </CardContent>
                        )}
                      </Card>
                    ))
                  ) : (
                    <Card className="border-dashed border-2 bg-muted/10">
                      <CardContent className="flex flex-col items-center text-center py-16">
                        <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">{t("reviews.emptyTitle")}</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                          {t("reviews.emptyDesc")}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{t("settings.title")}</h2>
                  <p className="text-muted-foreground">{t("settings.subtitle")}</p>
                </div>
                
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle>{t("settings.basicInfo")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {identityLocked ? (
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                        {nameCorrectionAllowed && correctionDeadline ? (
                          <Trans
                            i18nKey="settings.identityCorrection"
                            ns="profile"
                            values={{ date: format(correctionDeadline, "d MMMM yyyy, HH:mm", { locale: dateFnsLocale }) }}
                            components={{ deadline: <span className="font-medium text-foreground" /> }}
                          />
                        ) : (
                          t("settings.identityLocked")
                        )}
                      </div>
                    ) : null}

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-2">
                      <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                          {firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-3 text-center sm:text-left mt-2">
                        <div>
                          <h3 className="font-medium text-lg">{t("settings.avatarTitle")}</h3>
                          <p className="text-sm text-muted-foreground">{t("settings.avatarHint")}</p>
                        </div>
                        <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex">
                          <div className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl transition-colors font-medium cursor-pointer shadow-sm">
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {t("settings.changePhoto")}
                          </div>
                        </Label>
                        <input 
                          id="avatar-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleUploadAvatar}
                          disabled={isUploading}
                        />
                        {avatarUrl ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            disabled={isSaving}
                            onClick={async () => {
                              setAvatarUrl("");
                              try {
                                await updateProfile({ avatar_url: null });
                              } catch {
                                /* toast в контексте */
                              }
                            }}
                          >
                            {t("settings.removePhoto")}
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="font-medium">{t("settings.firstName")}</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder={t("settings.firstNamePlaceholder")}
                          className="rounded-xl bg-muted/50"
                          disabled={!namesEditable}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="font-medium">{t("settings.lastName")}</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder={t("settings.lastNamePlaceholder")}
                          className="rounded-xl bg-muted/50"
                          disabled={!namesEditable}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-medium">{t("settings.email")}</Label>
                      <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted cursor-not-allowed rounded-xl" />
                      <p className="text-xs text-muted-foreground">{t("settings.emailHint")}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="font-medium">{t("settings.phone")}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phoneEditable ? phone : phoneDisplay}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+7 700 123 45 67"
                          className="rounded-xl bg-muted/50"
                          disabled={!phoneEditable}
                          maxLength={18}
                        />
                        {phoneEditable ? (
                          <p className="text-xs text-muted-foreground">{t("settings.phoneHint")}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city" className="font-medium">{t("settings.city")}</Label>
                        <SearchableCitySelect
                          id="city"
                          cities={KAZAKHSTAN_CITIES}
                          value={city}
                          onChange={setCity}
                          placeholder={t("selectCity", { ns: "common" })}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="rounded-xl border border-dashed bg-muted/20 p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold">{t("settings.accountType")}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("settings.accountTypeCurrent")}{" "}
                          <span className="font-medium text-foreground">
                            {profile?.role ? roleLabelFn(profile.role) : "—"}
                          </span>
                        </p>
                        {!canChangeRole && cooldownUntil ? (
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                            {t("settings.roleCooldown", { date: format(cooldownUntil, "d MMMM yyyy", { locale: dateFnsLocale }) })}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">
                            {t("settings.roleChangeHint")}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        disabled={!canChangeRole}
                        onClick={() => {
                          setNewRole(profile?.role || "client");
                          setRoleRiskAccepted(false);
                          setRolePhrase("");
                          setRoleDialogOpen(true);
                        }}
                      >
                        {t("settings.changeAccountType")}
                      </Button>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving || !isSettingsDirty}
                        className="rounded-xl px-8 shadow-sm"
                        size="lg"
                      >
                        {isSaving ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("settings.saving")}</>
                        ) : (
                          t("settings.saveChanges")
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </PageContent>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("roleDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("roleDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(companyCount > 0 || activeTenderCount > 0) && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm space-y-1">
                <p className="font-medium text-foreground">{t("roleDialog.whatRemains")}</p>
                {companyCount > 0 ? (
                  <p className="text-muted-foreground">
                    {t("roleDialog.companiesRemain", { count: companyCount })}
                  </p>
                ) : null}
                {openTenderCount > 0 ? (
                  <p className="text-muted-foreground">
                    {t("roleDialog.openTenders", { count: openTenderCount })}
                  </p>
                ) : null}
                {activeTenderCount > openTenderCount ? (
                  <p className="text-muted-foreground">{t("roleDialog.activeTenders")}</p>
                ) : null}
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("roleDialog.newType")}</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as typeof newRole)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">{roleLabelFn("client")}</SelectItem>
                  <SelectItem value="contractor">{roleLabelFn("contractor")}</SelectItem>
                  <SelectItem value="supplier">{roleLabelFn("supplier")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground leading-relaxed">{t(`userRoleHints.${newRole}`, { ns: "catalogData" })}</p>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="role-risk"
                checked={roleRiskAccepted}
                onCheckedChange={(v) => setRoleRiskAccepted(v === true)}
              />
              <Label htmlFor="role-risk" className="text-sm font-normal leading-snug cursor-pointer">
                {t("roleDialog.confirmCheckbox")}
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-phrase">{t("roleDialog.confirmPhrase")}</Label>
              <Input
                id="role-phrase"
                value={rolePhrase}
                onChange={(e) => setRolePhrase(e.target.value)}
                placeholder={t("roleDialog.confirmPhrasePlaceholder")}
                className="rounded-xl font-mono"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setRoleDialogOpen(false)}>
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={roleSaving}
              onClick={async () => {
                if (!profile) return;
                if (newRole === profile.role) {
                  toast.error(t("roleDialog.selectDifferent"));
                  return;
                }
                if (!roleRiskAccepted) {
                  toast.error(t("roleDialog.acceptRisk"));
                  return;
                }
                if (rolePhrase.trim() !== t("roleDialog.confirmPhraseExact")) {
                  toast.error(t("roleDialog.phraseMismatch"));
                  return;
                }
                setRoleSaving(true);
                try {
                  await updateProfile({ role: newRole });
                  setRoleDialogOpen(false);
                  setRolePhrase("");
                  setRoleRiskAccepted(false);
                } catch {
                  /* сообщение об ошибке — в AuthContext */
                } finally {
                  setRoleSaving(false);
                }
              }}
            >
              {roleSaving ? t("settings.saving") : t("roleDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

