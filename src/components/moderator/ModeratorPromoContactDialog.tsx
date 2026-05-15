import { useEffect, useState } from "react";
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

const STAFF_PROMO_REPORT_REASONS = [
  { value: "policy", label: "Нарушение правил витрины / платформы" },
  { value: "misleading", label: "Вводящая в заблуждение подача / реклама" },
  { value: "inappropriate", label: "Неприемлемый контент" },
  { value: "other", label: "Иное (служебная фиксация)" },
] as const;

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
  const navigate = useNavigate();
  const createRequest = useCreateRequest();
  const submitReport = useSubmitReport();

  const [tab, setTab] = useState("request");
  const [requestTitle, setRequestTitle] = useState("");
  const [requestDetails, setRequestDetails] = useState("");
  const [reportReason, setReportReason] = useState<string>("policy");
  const [reportDetails, setReportDetails] = useState("");

  useEffect(() => {
    if (!open) return;
    setTab("request");
    const t = postTitle.trim();
    setRequestTitle(t ? `Служебный запрос по ролику: ${t}` : `Служебный запрос: ${companyName}`);
    setRequestDetails("");
    setReportReason("policy");
    setReportDetails("");
  }, [open, postTitle, companyName]);

  const handleRequest = async () => {
    if (!requestTitle.trim()) {
      toast.error("Укажите тему обращения");
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
      toast.success("Служебная заявка отправлена — откройте чат.");
      onOpenChange(false);
      openRequestChat(navigate, req.id);
    } catch {
      toast.error("Не удалось отправить заявку");
    }
  };

  const handleReport = async () => {
    const reasonLabel =
      STAFF_PROMO_REPORT_REASONS.find((r) => r.value === reportReason)?.label || reportReason;
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
      toast.success("Служебная жалоба зарегистрирована в очереди модерации.");
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Ошибка";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Служебное обращение по витрине
          </DialogTitle>
          <DialogDescription>
            Компания «{companyName}». Не путать с обычной заявкой клиента — текст помечается как от модерации.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-lg">
            <TabsTrigger value="request" className="text-xs sm:text-sm">
              Заявка в чат
            </TabsTrigger>
            <TabsTrigger value="report" className="text-xs sm:text-sm">
              Жалоба на компанию
            </TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground">
              Создаётся диалог с владельцем компании как у пользователя, но тема и первое сообщение помечены{" "}
              <span className="font-medium text-foreground">[Модерация]</span>.
            </p>
            <div className="space-y-2">
              <Label>Тема</Label>
              <Input
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Текст для владельца</Label>
              <Textarea
                value={requestDetails}
                onChange={(e) => setRequestDetails(e.target.value)}
                rows={4}
                className="rounded-xl resize-none"
                placeholder="Суть служебного запроса…"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                disabled={createRequest.isPending}
                onClick={() => void handleRequest()}
              >
                {createRequest.isPending ? "Отправка…" : "Отправить заявку"}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="report" className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground">
              Жалоба привязана к <strong>компании</strong> (контент витрины). В очереди будет отмечена как инициированная модератором.
            </p>
            <div className="space-y-2">
              <Label>Служебная категория</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_PROMO_REPORT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Обоснование</Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={4}
                maxLength={2000}
                className="rounded-xl"
                placeholder="Факты, ссылки на ролик, что проверить…"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                disabled={submitReport.isPending}
                onClick={() => void handleReport()}
              >
                {submitReport.isPending ? "Отправка…" : "Зафиксировать жалобу"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
