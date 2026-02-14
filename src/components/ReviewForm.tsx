import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview } from "@/hooks/useReviews";
import { toast } from "sonner";

interface ReviewFormProps {
  companyId: string;
}

const ReviewForm = ({ companyId }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();

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
      toast.success("Отзыв отправлен!");
      setRating(0);
      setComment("");
    } catch (error: any) {
      if (error?.message?.includes("unique_review_per_user_company")) {
        toast.error("Вы уже оставляли отзыв для этой компании");
      } else {
        toast.error("Ошибка при отправке отзыва");
      }
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
      <p className="font-medium">Оставить отзыв</p>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            onMouseEnter={() => setHoveredRating(i + 1)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-0.5"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                i < (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
        )}
      </div>
      <Textarea
        placeholder="Напишите ваш отзыв (необязательно)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={2000}
      />
      <Button onClick={handleSubmit} disabled={createReview.isPending || rating === 0}>
        {createReview.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Отправка...
          </>
        ) : (
          "Отправить отзыв"
        )}
      </Button>
    </div>
  );
};

export default ReviewForm;
