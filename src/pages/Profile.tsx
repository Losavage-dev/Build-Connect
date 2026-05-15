import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Building2, MessageSquare, Star, LogOut, Loader2, Plus, Upload, Settings as SettingsIcon, Trash2, FileText, MapPin } from "lucide-react";
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
import { KAZAKHSTAN_CITIES, TENDER_TYPE_LABELS, type TenderTypeValue } from "@/lib/constants";
import { useMyTenders, useUpdateTender, type TenderStatus } from "@/hooks/useTenders";
import { useAuth } from "@/contexts/AuthContext";
import { useRequests, useDeleteRequest } from "@/hooks/useRequests";
import { useInboxCounts } from "@/hooks/useInboxCounts";
import { useRequestChatSummaries } from "@/hooks/useRequestChatSummaries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompanies } from "@/hooks/useServices";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TenderResponsesPanel } from "@/components/TenderResponsesPanel";
import { TenderOwnerStatusSelect } from "@/components/TenderOwnerStatusSelect";
import { getRequestDisplay, isRequestIncoming } from "@/lib/requestDisplay";
import { getOnboardingIntent } from "@/lib/onboarding";
import { USER_ROLE_HINTS, USER_ROLE_LABELS, isStaffRole } from "@/lib/userRoles";
import { ModeratorWorkspace } from "@/components/moderator/ModeratorWorkspace";
import { NotificationsPanel } from "@/components/NotificationsPanel";

const PROFILE_TABS = ["requests", "tenders", "companies", "reviews", "settings"] as const;

const Profile = () => {
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

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
      setCity(profile.city || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && PROFILE_TABS.includes(tab as (typeof PROFILE_TABS)[number])) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
    setIsSaving(true);
    try {
      await updateProfile({ first_name: firstName, last_name: lastName, phone, city, avatar_url: avatarUrl });
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "На рассмотрении";
      case "accepted": return "В работе";
      case "rejected": return "Отклонена";
      case "completed": return "Завершена";
      default: return status;
    }
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
    switch (status) {
      case "pending":
        return "Заявка создана. Владелец компании ещё не сменил статус: он может написать вам в чате. Это не «ожидание модерации сайта».";
      case "accepted":
        return "Стороны договорились вести диалог / работу по этой заявке.";
      case "rejected":
        return "Владелец отметил заявку как отклонённую.";
      case "completed":
        return "Заявка закрыта как выполненная.";
      default:
        return "";
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту заявку? Это также удалит всю историю чата.")) {
      return;
    }
    
    try {
      await deleteRequest.mutateAsync(id);
      toast.success("Заявка успешно удалена");
    } catch {
      toast.error("Ошибка при удалении заявки");
    }
  };

  const requestScopeCounts = useMemo(() => {
    if (!requests?.length || !profile?.id) return { all: 0, incoming: 0, outgoing: 0 };
    let incoming = 0;
    for (const r of requests) {
      if (isRequestIncoming(r, profile.id)) incoming++;
    }
    return { all: requests.length, incoming, outgoing: requests.length - incoming };
  }, [requests, profile?.id]);

  const filteredRequests = useMemo(() => {
    if (!requests?.length) return [];
    if (!profile?.id || requestsScope === "all") return requests;
    return requests.filter((r) => {
      const incoming = isRequestIncoming(r, profile.id);
      return requestsScope === "incoming" ? incoming : !incoming;
    });
  }, [requests, requestsScope, profile?.id]);

  const cooldownUntil = profile?.last_role_change_at
    ? addDays(new Date(profile.last_role_change_at), 14)
    : null;
  const canChangeRole = !cooldownUntil || cooldownUntil.getTime() <= Date.now();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container px-4 py-8">
        <NotificationsPanel />
        <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
          
          {/* Sidebar */}
          <div className="w-full md:w-72 shrink-0 space-y-6">
            <div className="bg-card rounded-2xl p-6 border text-center shadow-sm">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-background shadow-md">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                  {firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-bold text-xl mb-1 line-clamp-1">
                {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : user?.email?.split("@")[0]}
              </h2>
              <p className="text-sm text-muted-foreground mb-6 font-medium">
                {profile?.role === "client" ? "Заказчик" : profile?.role === "contractor" ? "Подрядчик" : "Поставщик"}
              </p>
              <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти из аккаунта
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
                  Заявки и Чаты
                </div>
                {(inbox?.total ?? 0) > 0 && (
                  <Badge variant={activeTab === "requests" ? "secondary" : "destructive"} className="rounded-full px-2">
                    {inbox!.total > 99 ? "99+" : inbox!.total}
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
                Мои тендеры
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
                Мои компании
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
                Мои отзывы
              </button>

              <button 
                onClick={() => setActiveTab("settings")}
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all ${
                  activeTab === "settings" 
                  ? "bg-primary text-primary-foreground font-semibold shadow-md" 
                  : "hover:bg-muted text-foreground font-medium"
                }`}
              >
                <SettingsIcon className="h-5 w-5 mr-3" />
                Настройки профиля
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "requests" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Заявки и Чаты</h2>
                  <p className="text-muted-foreground">История ваших обращений и переписки с компаниями</p>
                  <p className="text-xs text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                    Плашка «На рассмотрении» — статус заявки: вы или компания ещё не сменили его на «в работе» / «отклонена».
                    Входящие — заявки к вашим компаниям и личные отклики на тендеры (если у вас нет компании, отклики
                    приходят в профиль, а не в карточку фирмы). Исходящие — то, что вы отправили. После отправки заявки
                    открывается чат; в первом сообщении — контекст (каталог, услуга, материал, тендер или ролик).
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
                        <h3 className="font-semibold text-lg mb-2">У вас пока нет заявок</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                          Найдите подходящего подрядчика или поставщика в каталоге и отправьте им заявку.
                        </p>
                        <Button onClick={() => navigate("/catalog")} className="rounded-xl shadow-md">
                          <Plus className="h-4 w-4 mr-2" />
                          Перейти в каталог
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
                        <ToggleGroupItem value="all" aria-label="Все заявки" className="rounded-lg px-3 sm:px-4 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:border-border">
                          Все ({requestScopeCounts.all})
                        </ToggleGroupItem>
                        <ToggleGroupItem value="incoming" aria-label="Входящие" className="rounded-lg px-3 sm:px-4 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:border-border">
                          Входящие ({requestScopeCounts.incoming})
                        </ToggleGroupItem>
                        <ToggleGroupItem value="outgoing" aria-label="Исходящие" className="rounded-lg px-3 sm:px-4 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:border-border">
                          Исходящие ({requestScopeCounts.outgoing})
                        </ToggleGroupItem>
                      </ToggleGroup>

                      {filteredRequests.length === 0 ? (
                        <Card className="border-dashed border-2 bg-muted/10">
                          <CardContent className="flex flex-col items-center text-center py-12">
                            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <h3 className="font-semibold mb-1">Нет заявок в этом разделе</h3>
                            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                              {requestsScope === "incoming"
                                ? "Входящие: заявки в ваши компании из каталога, заказы услуг/материалов и отклики на ваши тендеры. Если компании нет — отклики на тендер попадают сюда лично (поле recipient_profile_id в БД)."
                                : "Исходящие: заявки в чужие компании, заказы с витрин и ваши отклики на тендеры (в компанию автора или лично, если у автора нет компании)."}
                            </p>
                            <Button variant="outline" className="rounded-xl" onClick={() => setRequestsScope("all")}>
                              Показать все
                            </Button>
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
                      
                      return (
                        <Card
                          key={request.id}
                          className={cn(
                            "hover-lift border-2 transition-all overflow-hidden group",
                            unread > 0
                              ? "border-primary/50 shadow-md shadow-primary/10 bg-primary/[0.04]"
                              : "border-transparent hover:border-primary/20",
                          )}
                        >
                          <CardHeader className="bg-muted/30 pb-4">
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
                                      {isIncoming ? "Входящая" : "Исходящая"}
                                    </Badge>
                                    {unread > 0 ? (
                                      <Badge className="rounded-full px-2 py-0 text-[10px] h-5">
                                        {unread > 99 ? "99+" : unread} непрочит.
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
                                Заявка от {format(new Date(request.created_at), "d MMM yyyy", { locale: ru })}
                              </span>
                              <span className="text-xs text-muted-foreground mt-1">Последнее в чате</span>
                              <span className="text-sm text-foreground line-clamp-2 mt-0.5 max-w-xl break-words">
                                {lastPreview || "Пока нет сообщений — откройте чат, чтобы начать переписку."}
                              </span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                onClick={() => handleDeleteRequest(request.id)}
                                disabled={deleteRequest.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button onClick={() => navigate(`/chat/${request.id}`)} className="rounded-xl shadow-sm group-hover:bg-primary/90 transition-colors">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Перейти в чат
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
                    <h2 className="text-2xl font-bold mb-1">Мои тендеры</h2>
                    <p className="text-muted-foreground">
                      Управляйте статусом: открыт — принимает отклики, в работе / закрыт — отклики недоступны
                    </p>
                  </div>
                  <Button className="rounded-xl" onClick={() => navigate("/tenders")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать тендер
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
                      <h3 className="font-semibold text-lg mb-2">У вас пока нет тендеров</h3>
                      <p className="text-muted-foreground mb-6 max-w-sm">
                        Опубликуйте тендер, чтобы найти подрядчика, поставщика или исполнителя — независимо от роли в профиле.
                      </p>
                      <Button onClick={() => navigate("/tenders")} className="rounded-xl">
                        Перейти к тендерам
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
                              {TENDER_TYPE_LABELS[(tender.tender_type || "subcontract") as TenderTypeValue] || "Другое"}
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
                              Создан {format(new Date(tender.created_at), "d MMM yyyy", { locale: ru })}
                            </span>
                          </div>
                          <div className="max-w-md">
                            <TenderOwnerStatusSelect
                              tenderId={tender.id}
                              tenderTitle={tender.title}
                              status={tender.status}
                              label="Статус"
                              disabled={updateTender.isPending}
                              onStatusChange={(v) =>
                                updateTender.mutate(
                                  { id: tender.id, status: v },
                                  {
                                    onSuccess: () => toast.success("Статус обновлён"),
                                    onError: () => toast.error("Не удалось изменить статус"),
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
                    <h2 className="text-2xl font-bold mb-1">Мои компании</h2>
                    <p className="text-muted-foreground">Управление профилями ваших компаний</p>
                  </div>
                  <Button onClick={() => navigate("/create-company")} className="rounded-xl shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Создать
                  </Button>
                </div>

                {showCreateCompanyNudge ? (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-foreground">
                        Вы выбрали «Создать компанию» при регистрации — добавьте карточку, чтобы попасть в каталог и
                        откликаться на тендеры.
                      </p>
                      <Button className="rounded-xl shrink-0" onClick={() => navigate("/create-company")}>
                        Создать компанию
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
                                <img src={company.logo_url} alt="Логотип" className="w-full h-full object-cover rounded-xl" />
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
                            Открыть профиль
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full">
                      <Card className="border-dashed border-2 bg-muted/10">
                        <CardContent className="flex flex-col items-center text-center py-12">
                          <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                          <h3 className="font-semibold text-lg mb-2">Нет добавленных компаний</h3>
                          <p className="text-muted-foreground mb-6 max-w-md">
                            Создайте карточку компании, чтобы принимать заявки, публиковать услуги и материалы. Доступно
                            при любой роли в профиле.
                          </p>
                          <Button onClick={() => navigate("/create-company")} className="rounded-xl">
                            <Plus className="h-4 w-4 mr-2" />
                            Зарегистрировать компанию
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
                  <h2 className="text-2xl font-bold mb-1">Мои отзывы</h2>
                  <p className="text-muted-foreground">Отзывы, которые вы оставили компаниям</p>
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
                                Отзыв на: <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate(`/company/${review.company_id}`)}>{review.company?.name}</span>
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {format(new Date(review.created_at), "d MMMM yyyy", { locale: ru })}
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
                        <h3 className="font-semibold text-lg mb-2">У вас пока нет отзывов</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                          После завершения работы с компанией, не забудьте оставить отзыв об их работе на странице компании.
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
                  <h2 className="text-2xl font-bold mb-1">Настройки профиля</h2>
                  <p className="text-muted-foreground">Управление личными данными и аккаунтом</p>
                </div>
                
                <Card className="border-0 shadow-md">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle>Основная информация</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-2">
                      <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                          {firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-3 text-center sm:text-left mt-2">
                        <div>
                          <h3 className="font-medium text-lg">Фотография профиля</h3>
                          <p className="text-sm text-muted-foreground">Будет отображаться в ваших отзывах и чатах</p>
                        </div>
                        <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex">
                          <div className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-xl transition-colors font-medium cursor-pointer shadow-sm">
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Изменить фото
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
                            Убрать фото
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="font-medium">Имя</Label>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Введите имя" className="rounded-xl bg-muted/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="font-medium">Фамилия</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Введите фамилию" className="rounded-xl bg-muted/50" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-medium">Email</Label>
                      <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted cursor-not-allowed rounded-xl" />
                      <p className="text-xs text-muted-foreground">Email привязан к вашей учетной записи и не подлежит изменению напрямую.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="font-medium">Телефон</Label>
                        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (777) 123-45-67" className="rounded-xl bg-muted/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city" className="font-medium">Город</Label>
                        <SearchableCitySelect
                          id="city"
                          cities={KAZAKHSTAN_CITIES}
                          value={city}
                          onChange={setCity}
                          placeholder="Выберите город"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="rounded-xl border border-dashed bg-muted/20 p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold">Тип аккаунта</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Сейчас:{" "}
                          <span className="font-medium text-foreground">
                            {profile?.role ? USER_ROLE_LABELS[profile.role] : "—"}
                          </span>
                        </p>
                        {!canChangeRole && cooldownUntil ? (
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                            Следующая смена роли будет доступна с{" "}
                            {format(cooldownUntil, "d MMMM yyyy", { locale: ru })} (не чаще раза в 14 дней).
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">
                            Смена роли требует явного подтверждения и ограничена по частоте — защита от случайных
                            переключений.
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
                        Сменить тип аккаунта…
                      </Button>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button onClick={handleSaveProfile} disabled={isSaving} className="rounded-xl px-8 shadow-sm" size="lg">
                        {isSaving ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Сохранение...</>
                        ) : (
                          "Сохранить изменения"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Смена типа аккаунта</DialogTitle>
            <DialogDescription>
              Роль — подсказка интерфейса, а не удаление данных. Не чаще одного раза в 14 дней — проверка на стороне
              сервера.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(companyCount > 0 || activeTenderCount > 0) && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm space-y-1">
                <p className="font-medium text-foreground">Что останется при смене роли:</p>
                {companyCount > 0 ? (
                  <p className="text-muted-foreground">
                    {companyCount} {companyCount === 1 ? "компания" : "компаний"} в каталоге и связанные услуги/материалы.
                  </p>
                ) : null}
                {openTenderCount > 0 ? (
                  <p className="text-muted-foreground">
                    {openTenderCount} открытых тендеров — отклики по-прежнему принимаются.
                  </p>
                ) : null}
                {activeTenderCount > openTenderCount ? (
                  <p className="text-muted-foreground">Тендеры «В работе» и переписки не удаляются.</p>
                ) : null}
              </div>
            )}
            <div className="space-y-2">
              <Label>Новый тип</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as typeof newRole)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">{USER_ROLE_LABELS.client}</SelectItem>
                  <SelectItem value="contractor">{USER_ROLE_LABELS.contractor}</SelectItem>
                  <SelectItem value="supplier">{USER_ROLE_LABELS.supplier}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground leading-relaxed">{USER_ROLE_HINTS[newRole]}</p>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="role-risk"
                checked={roleRiskAccepted}
                onCheckedChange={(v) => setRoleRiskAccepted(v === true)}
              />
              <Label htmlFor="role-risk" className="text-sm font-normal leading-snug cursor-pointer">
                Я понимаю, что смена типа аккаунта изменит подписи и подсказки, но не удалит компании, тендеры и чаты
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-phrase">Введите слово заглавными: ПОДТВЕРЖДАЮ</Label>
              <Input
                id="role-phrase"
                value={rolePhrase}
                onChange={(e) => setRolePhrase(e.target.value)}
                placeholder="ПОДТВЕРЖДАЮ"
                className="rounded-xl font-mono"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setRoleDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              disabled={roleSaving}
              onClick={async () => {
                if (!profile) return;
                if (newRole === profile.role) {
                  toast.error("Выберите тип, отличный от текущего");
                  return;
                }
                if (!roleRiskAccepted) {
                  toast.error("Отметьте, что вы понимаете последствия");
                  return;
                }
                if (rolePhrase.trim() !== "ПОДТВЕРЖДАЮ") {
                  toast.error("Введите ровно: ПОДТВЕРЖДАЮ");
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
              {roleSaving ? "Сохранение…" : "Подтвердить смену"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

