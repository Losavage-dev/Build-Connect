import { useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRequest } from "@/hooks/useRequests";
import { useSubmitReport } from "@/hooks/useReports";
import { buildRequestSource } from "@/lib/requestSource";
import { openRequestChat } from "@/lib/openRequestChat";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { firstZodError, reportSchema } from "@/lib/validation";

const STAFF_PROMO_REPORT_REASON_KEYS = ["policy", "misleading", "inappropriate", "other"] as const;
type StaffPromoReportReasonKey = (typeof STAFF_PROMO_REPORT_REASON_KEYS)[number];

/** Russian labels stored in DB/API — not UI copy */
const STAFF_PROMO_REPORT_REASONS_RU: Record<StaffPromoReportReasonKey, string> = {
  policy: "Нарушение правил витрины / платформы",
  misleading: "Вводящая в заблуждение подача / реклама",
  inappropriate: "Неприемлемый контент",
  other: "Иное (служебная фиксация)",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  postId: string;
  postTitle: string;
};

export function ModeratorPromoContactDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  postId,
  postTitle,
}: Props) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const createRequest = useCreateRequest();
  const submitReport = useSubmitReport();

  const [tab, setTab] = useState("request");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const [reportReason, setReportReason] = useState<StaffPromoReportReasonKey>("policy");
  const [reportDetails, setReportDetails] = useState("");

  const reportReasonOptions = useMemo(
    () =>
      STAFF_PROMO_REPORT_REASON_KEYS.map((value) => ({
        value,
        label: t(`moderator.promoContact.reasons.${value}`),
      })),
    [t],
  );

  useEffect(() => {
    if (!open) return;
    setTab("request");
    const trimmedTitle = postTitle.trim();
    setRequestTitle(
      trimmedTitle
        ? `Служебный запрос по ролику: ${trimmedTitle}`
        : `Служебный запрос: ${companyName}`,
    );
    setRequestDetails("");
    setReportReason("policy");
    setReportDetails("");
  }, [open, postTitle, companyName]);

  const handleRequest = async () => {
    if (!requestTitle.trim()) {
      toast.error(t("moderator.promoContact.titleRequired"));
      return;
    }
    const body = requestDetails.trim();
    const wrapped =
      "Служебное обращение модератора платформы BuildConnect.\n\n" +
      (body || "(текст не указан — уточните в чате)");
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const feedUrl = postId ? `${origin}/feed?post=${encodeURIComponent(postId)}` : `${origin}/feed`;
      const req = await createRequest.mutateAsync({
        company_id: companyId,
        title: `[Модерация] ${requestTitle.trim()}`,
        description: wrapped,
        initial_message: wrapped,
        promo_post_id: postId || undefined,
        source: buildRequestSource({
          kind: "promo",
          detail: postTitle.trim() ? `ролик «${postTitle.trim()}»` : `витрина — ${companyName}`,
          url: feedUrl,
        }),
      });
      toast.success(t("moderator.promoContact.requestSuccess"));
      onOpenChange(false);
      openRequestChat(navigate, req.id);
    } catch {
      toast.error(t("moderator.promoContact.requestError"));
    }
  };

  const handleReport = async () => {
    const reasonLabel = STAFF_PROMO_REPORT_REASONS_RU[reportReason] || reportReason;
    const parsed = reportSchema.safeParse({ reason: reasonLabel, details: reportDetails });
    const err = firstZodError(parsed);
    if (err) {
      toast.error(err);
      return;
    }
    try {
      await submitReport.mutateAsync({
        target_type: "company",
        target_id: companyId,
        reason: reasonLabel,
        details: reportDetails.trim() || undefined,
        initiated_by_staff: true,
      });
      toast.success(t("moderator.promoContact.reportSuccess"));
      onOpenChange(false);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : t("moderator.promoContact.error");
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t("moderator.promoContact.title")}
          </DialogTitle>
          <DialogDescription>{t("moderator.promoContact.desc", { company: companyName })}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-lg">
            <TabsTrigger value="request" className="text-xs sm:text-sm">
              {t("moderator.promoContact.tabRequest")}
            </TabsTrigger>
            <TabsTrigger value="report" className="text-xs sm:text-sm">
              {t("moderator.promoContact.tabReport")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground">
              <Trans
                ns="common"
                i18nKey="moderator.promoContact.requestHint"
                components={{ tag: <span className="font-medium text-foreground" /> }}
              />
            </p>
            <div className="space-y-2">
              <Label>{t("moderator.promoContact.subject")}</Label>
              <Input
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("moderator.promoContact.messageForOwner")}</Label>
              <Textarea
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                rows={4}
                className="rounded-xl resize-none"
                placeholder={t("moderator.promoContact.messagePlaceholder")}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                disabled={createRequest.isPending}
                onClick={() => void handleRequest()}
              >
                {createRequest.isPending ? t("sending") : t("moderator.promoContact.submitRequest")}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="report" className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground">
              <Trans
                ns="common"
                i18nKey="moderator.promoContact.reportHint"
                components={{ strong: <strong /> }}
              />
            </p>
            <div className="space-y-2">
              <Label>{t("moderator.promoContact.staffCategory")}</Label>
              <Select value={reportReason} onValueChange={(v) => setReportReason(v as StaffPromoReportReasonKey)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportReasonOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("moderator.promoContact.justification")}</Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={4}
                maxLength={2000}
                className="rounded-xl"
                placeholder={t("moderator.promoContact.justificationPlaceholder")}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                disabled={submitReport.isPending}
                onClick={() => void handleReport()}
              >
                {submitReport.isPending ? t("sending") : t("moderator.promoContact.submitReport")}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
