import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Building2, Calendar, ChevronRight, Clock, MapPin } from "lucide-react";
import { authPath } from "@/lib/authRedirect";
import {
  formatTenderDate,
  formatTenderDateShort,
  getTenderDeadlineMaxDays,
} from "@/lib/tenderDisplay";
import { TENDER_TYPE_LABELS, type TenderTypeValue } from "@/lib/constants";
import type { Tender, TenderStatus } from "@/hooks/useTenders";
import type { useCapabilities } from "@/hooks/useCapabilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TenderResponsesPanel } from "@/components/TenderResponsesPanel";
import { TenderOwnerStatusSelect } from "@/components/TenderOwnerStatusSelect";
import { ReportDialog } from "@/components/ReportDialog";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useTrackUserEvent } from "@/hooks/useUserEvents";

const statusLabels: Record<string, string> = {
  open: "Открыт",
  closed: "Закрыт",
  in_progress: "В работе",
};

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

function formatBudget(budget: number | null) {
  if (!budget) return "Не указан";
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(budget);
}

type Caps = ReturnType<typeof useCapabilities>;

type Props = {
  tender: Tender;
  user: { id: string } | null;
  profile: { id: string } | null | undefined;
  caps: Caps;
  returnTo: string;
  myCompanies?: { id: string; name: string }[];
  existingBidRequestId?: string | null;
  onBid: (tender: Tender, companyId: string, description: string) => void | Promise<void>;
  bidPending: boolean;
  onStatusChange: (tenderId: string, status: TenderStatus) => void;
  statusUpdatePending: boolean;
};

export function TenderCard({
  tender,
  user,
  profile,
  caps,
  returnTo,
  myCompanies,
  existingBidRequestId,
  onBid,
  bidPending,
  onStatusChange,
  statusUpdatePending,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { track } = useTrackUserEvent();
  const sheetTrackedRef = useRef(false);
  const listViewTrackedRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [bidOpen, setBidOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen || sheetTrackedRef.current) return;
    sheetTrackedRef.current = true;
    track("view_tender", "tender", tender.id, {
      city: tender.city,
      tender_type: tender.tender_type,
    });
  }, [sheetOpen, tender.id, tender.city, tender.tender_type, track]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || listViewTrackedRef.current) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          if (timer) clearTimeout(timer);
          timer = null;
          return;
        }
        if (listViewTrackedRef.current) return;
        timer = setTimeout(() => {
          if (listViewTrackedRef.current) return;
          listViewTrackedRef.current = true;
          track("view_tender", "tender", tender.id, {
            city: tender.city,
            tender_type: tender.tender_type,
            source: "list_impression",
          });
        }, 1500);
      },
      { threshold: 0.55 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [tender.id, tender.city, tender.tender_type, track]);
  const [bidCompanyId, setBidCompanyId] = useState("");
  const [bidDescription, setBidDescription] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [bidTimeline, setBidTimeline] = useState("");

  useEffect(() => {
    if (!bidOpen || bidCompanyId) return;
    if (myCompanies?.length === 1) {
      setBidCompanyId(myCompanies[0].id);
    }
  }, [bidOpen, bidCompanyId, myCompanies]);

  const resetBidForm = () => {
    setBidCompanyId("");
    setBidDescription("");
    setBidPrice("");
    setBidTimeline("");
  };

  const composeBidMessage = (): string => {
    const parts: string[] = [];
    const price = bidPrice.trim();
    const timeline = bidTimeline.trim();
    const proposal = bidDescription.trim();

    if (price) parts.push(`Предлагаемая цена: ${price} ₸`);
    if (timeline) parts.push(`Срок выполнения: ${timeline} дн.`);
    if (proposal) {
      if (parts.length) parts.push("");
      parts.push("Условия и комментарий:");
      parts.push(proposal);
    }
    return parts.join("\n");
  };

  const isOwner = profile?.id === tender.client_id;
  const canSubmitBid = caps.canBidOnTender(tender) && !existingBidRequestId;
  const hasExistingBid = Boolean(existingBidRequestId);
  const typeLabel =
    TENDER_TYPE_LABELS[(tender.tender_type || "subcontract") as TenderTypeValue] || "Другое";
  const published = formatTenderDateShort(tender.created_at);
  const deadline = formatTenderDate(tender.deadline);
  const maxBidTimelineDays = getTenderDeadlineMaxDays(tender.deadline);
  const bidTimelineDays = bidTimeline ? Number.parseInt(bidTimeline, 10) : null;
  const bidTimelineExceedsDeadline =
    maxBidTimelineDays !== null &&
    bidTimelineDays !== null &&
    !Number.isNaN(bidTimelineDays) &&
    bidTimelineDays > maxBidTimelineDays;
  const company = tender.poster_company;

  const handleBidTimelineChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (!digits) {
      setBidTimeline("");
      return;
    }
    const value = Number.parseInt(digits, 10);
    if (maxBidTimelineDays !== null && value > maxBidTimelineDays) {
      setBidTimeline(String(maxBidTimelineDays));
      return;
    }
    setBidTimeline(digits);
  };

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidCompanyId) return;
    if (bidTimelineExceedsDeadline) return;
    const messageBody = composeBidMessage();
    if (messageBody.length < 10) return;

    void Promise.resolve(onBid(tender, bidCompanyId, messageBody)).then(() => {
      setBidOpen(false);
      resetBidForm();
    });
  };

  const metaLine = [
    tender.city,
    tender.budget ? formatBudget(tender.budget) : null,
    deadline ? `до ${deadline}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const bidForm = (
    <form onSubmit={handleBidSubmit} className="space-y-4">
      <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground line-clamp-2">{tender.title}</p>
        {metaLine ? <p>{metaLine}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`bid-company-${tender.id}`}>Ваша компания</Label>
        <Select value={bidCompanyId} onValueChange={setBidCompanyId} required>
          <SelectTrigger id={`bid-company-${tender.id}`} className="rounded-xl">
            <SelectValue placeholder="Выберите компанию..." />
          </SelectTrigger>
          <SelectContent>
            {myCompanies?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`bid-price-${tender.id}`}>Цена (₸)</Label>
          <Input
            id={`bid-price-${tender.id}`}
            type="text"
            inputMode="numeric"
            value={bidPrice}
            onChange={(e) => setBidPrice(e.target.value.replace(/[^\d\s]/g, ""))}
            placeholder={tender.budget ? `Бюджет: ${formatBudget(tender.budget)}` : "Например: 1 500 000"}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`bid-timeline-${tender.id}`}>Срок (дней)</Label>
          <Input
            id={`bid-timeline-${tender.id}`}
            type="text"
            inputMode="numeric"
            value={bidTimeline}
            onChange={(e) => handleBidTimelineChange(e.target.value)}
            placeholder={
              maxBidTimelineDays !== null ? `до ${maxBidTimelineDays} дн.` : "30"
            }
            className="rounded-xl"
            maxLength={4}
            aria-invalid={bidTimelineExceedsDeadline}
          />
          {maxBidTimelineDays !== null ? (
            <p className="text-xs text-muted-foreground">
              Не более {maxBidTimelineDays} дн. — дедлайн тендера{deadline ? ` ${deadline}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`bid-proposal-${tender.id}`}>Условия и комментарий</Label>
        <Textarea
          id={`bid-proposal-${tender.id}`}
          value={bidDescription}
          onChange={(e) => setBidDescription(e.target.value)}
          rows={4}
          required
          minLength={10}
          maxLength={2000}
          placeholder="Опишите объём работ, гарантии, что входит в цену..."
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">{bidDescription.trim().length} / 2000</p>
      </div>

      <Button
        type="submit"
        className="w-full rounded-xl"
        disabled={
          bidPending ||
          !bidCompanyId ||
          composeBidMessage().length < 10 ||
          bidTimelineExceedsDeadline
        }
      >
        {bidPending ? "Отправка..." : "Отправить отклик"}
      </Button>
    </form>
  );

  return (
    <>
      <Card
        ref={cardRef}
        id={`tender-listing-${tender.id}`}
        className="border hover:border-primary/25 hover:shadow-sm transition-all"
      >
        <CardContent className="p-4">
          <div className="mb-2">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                {typeLabel}
              </Badge>
              <Badge
                className={`text-[10px] px-1.5 py-0 h-5 font-medium border-0 ${statusColors[tender.status] || ""}`}
              >
                {statusLabels[tender.status] || tender.status}
              </Badge>
            </div>
            <h3 className="font-semibold text-base leading-snug line-clamp-2">{tender.title}</h3>
          </div>

          {company ? (
            <Link
              to={`/company/${company.id}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-2"
            >
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt=""
                  className="h-6 w-6 rounded object-cover border shrink-0"
                />
              ) : (
                <Building2 className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate font-medium">{company.name}</span>
              <VerifiedBadge className="scale-90 origin-left shrink-0" />
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              Заказчик без карточки компании
            </p>
          )}

          {metaLine ? <p className="text-sm text-muted-foreground line-clamp-1 mb-1">{metaLine}</p> : null}

          {published ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
              <Clock className="h-3 w-3" />
              Опубликован {published}
            </p>
          ) : (
            <div className="mb-3" />
          )}

          <div className="flex flex-wrap gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-8">
                  Подробнее
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-left pr-8">{tender.title}</SheetTitle>
                  <SheetDescription asChild>
                    <div className="text-left space-y-3 pt-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{typeLabel}</Badge>
                        <Badge className={statusColors[tender.status] || ""}>
                          {statusLabels[tender.status]}
                        </Badge>
                      </div>
                      {company ? (
                        <Link
                          to={`/company/${company.id}`}
                          className="flex items-center gap-2 text-sm font-medium text-primary"
                        >
                          <Building2 className="h-4 w-4" />
                          {company.name}
                        </Link>
                      ) : null}
                      <dl className="space-y-2 text-sm">
                        {tender.city ? (
                          <div className="flex gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <dt className="text-muted-foreground text-xs">Город</dt>
                              <dd>{tender.city}</dd>
                            </div>
                          </div>
                        ) : null}
                        <div>
                          <dt className="text-muted-foreground text-xs">Бюджет</dt>
                          <dd className="font-medium">{formatBudget(tender.budget)}</dd>
                        </div>
                        {deadline ? (
                          <div className="flex gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <dt className="text-muted-foreground text-xs">Дедлайн</dt>
                              <dd>{deadline}</dd>
                            </div>
                          </div>
                        ) : null}
                        {published ? (
                          <div className="flex gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <dt className="text-muted-foreground text-xs">Опубликован</dt>
                              <dd>{formatTenderDate(tender.created_at)}</dd>
                            </div>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  </SheetDescription>
                </SheetHeader>

                <p className="text-sm whitespace-pre-wrap mt-4 mb-6">{tender.description}</p>

                {isOwner ? (
                  <div className="space-y-4 mb-6">
                    <TenderOwnerStatusSelect
                      tenderId={tender.id}
                      tenderTitle={tender.title}
                      status={tender.status}
                      disabled={statusUpdatePending}
                      onStatusChange={(v) => onStatusChange(tender.id, v)}
                    />
                    <TenderResponsesPanel
                      tenderId={tender.id}
                      tenderTitle={tender.title}
                      tenderStatus={tender.status}
                    />
                  </div>
                ) : null}

                {!user && tender.status === "open" ? (
                  <Button asChild className="w-full rounded-xl mb-4">
                    <Link to={authPath(returnTo)}>Войти, чтобы откликнуться</Link>
                  </Button>
                ) : null}

                {canSubmitBid ? (
                  <Button className="w-full rounded-xl mb-4" onClick={() => setBidOpen(true)}>
                    Откликнуться
                  </Button>
                ) : null}

                {hasExistingBid ? (
                  <Button asChild className="w-full rounded-xl mb-4" variant="secondary">
                    <Link to={`/chat/${existingBidRequestId}`}>Ваш отклик — открыть чат</Link>
                  </Button>
                ) : null}

                {user && !caps.isStaff && !isOwner && tender.status === "open" && !canSubmitBid && !hasExistingBid ? (
                  <div className="text-sm text-muted-foreground text-center mb-4 space-y-2">
                    <p>{caps.bidBlockReason(tender) || "Отклик недоступен"}</p>
                    {caps.myCompanyIds.length === 0 && !isOwner ? (
                      <Button variant="outline" size="sm" className="rounded-lg" asChild>
                        <Link to="/create-company">Создать компанию</Link>
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {user && !isOwner ? (
                  <div className="flex justify-end border-t pt-4">
                    <ReportDialog
                      targetType="tender"
                      targetId={tender.id}
                      targetLabel={tender.title}
                      variant={caps.isStaff ? "moderator" : "user"}
                    />
                  </div>
                ) : null}
              </SheetContent>
            </Sheet>

            {canSubmitBid ? (
              <Button size="sm" className="h-8 rounded-lg" onClick={() => setBidOpen(true)}>
                Откликнуться
              </Button>
            ) : null}

            {hasExistingBid ? (
              <Button size="sm" variant="secondary" className="h-8 rounded-lg" asChild>
                <Link to={`/chat/${existingBidRequestId}`}>Ваш отклик</Link>
              </Button>
            ) : null}

            {!user && tender.status === "open" ? (
              <Button size="sm" variant="secondary" className="h-8" asChild>
                <Link to={authPath(returnTo)}>Войти</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog open={bidOpen} onOpenChange={(open) => {
        setBidOpen(open);
        if (!open) resetBidForm();
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Отклик на тендер</DialogTitle>
            <DialogDescription>
              Укажите цену, срок и условия — заказчик получит отклик и сможет перейти в чат.
            </DialogDescription>
          </DialogHeader>
          {bidForm}
        </DialogContent>
      </Dialog>
    </>
  );
}
