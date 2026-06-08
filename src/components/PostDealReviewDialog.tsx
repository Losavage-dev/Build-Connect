import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreateReview } from "@/hooks/useReviews";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1 justify-center py-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-1 rounded-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} звёзд`}
        >
          <Star
            className={cn(
              "h-9 w-9",
              (hover || value) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** Модальное окно отзыва о компании после завершения заявки (заказчик). */
export function PostDealReviewDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
}: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();

  useEffect(() => {
    if (open) {
      setRating(0);
      setComment("");
    }
  }, [open, companyId]);

  const handleSkip = () => onOpenChange(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Выберите оценку");
      return;
    }

    try {
      await createReview.mutateAsync({
        company_id: companyId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Отзыв о компании отправлен");
      onOpenChange(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("unique_review_per_user_company")) {
        toast.error("Вы уже оставляли отзыв этой компании");
        onOpenChange(false);
      } else {
        toast.error("Не удалось отправить отзыв");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Оцените компанию «{companyName}»</DialogTitle>
          <DialogDescription>
            Сделка завершена. Ваш отзыв поможет другим заказчикам выбрать проверенного подрядчика или поставщика.
          </DialogDescription>
        </DialogHeader>

        <StarRating value={rating} onChange={setRating} />

        <Textarea
          placeholder="Комментарий (необязательно)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px] rounded-xl resize-none"
          maxLength={2000}
        />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="ghost" className="rounded-xl" onClick={handleSkip} disabled={createReview.isPending}>
            Позже
          </Button>
          <Button type="button" className="rounded-xl flex-1" onClick={() => void handleSubmit()} disabled={createReview.isPending}>
            {createReview.isPending ? "Отправка…" : "Отправить отзыв"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
