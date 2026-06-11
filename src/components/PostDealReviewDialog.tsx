import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("profile");
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
          aria-label={t("postDealReview.starsAria", { count: star })}
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
  const { t } = useTranslation(["profile", "common"]);
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
      toast.error(t("postDealReview.ratingRequired"));
      return;
    }

    try {
      await createReview.mutateAsync({
        company_id: companyId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success(t("postDealReview.success"));
      onOpenChange(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("unique_review_per_user_company")) {
        toast.error(t("postDealReview.duplicate"));
        onOpenChange(false);
      } else {
        toast.error(t("postDealReview.error"));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("postDealReview.title", { name: companyName })}</DialogTitle>
          <DialogDescription>{t("postDealReview.desc")}</DialogDescription>
        </DialogHeader>

        <StarRating value={rating} onChange={setRating} />

        <Textarea
          placeholder={t("postDealReview.commentPlaceholder")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px] rounded-xl resize-none"
          maxLength={2000}
        />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="ghost" className="rounded-xl" onClick={handleSkip} disabled={createReview.isPending}>
            {t("postDealReview.later")}
          </Button>
          <Button type="button" className="rounded-xl flex-1" onClick={() => void handleSubmit()} disabled={createReview.isPending}>
            {createReview.isPending ? t("postDealReview.sending") : t("postDealReview.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
