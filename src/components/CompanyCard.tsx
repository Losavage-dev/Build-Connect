import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CompanyRatingBadge from "@/components/CompanyRatingBadge";
import type { CompanyReviewStats } from "@/lib/companyReviewStats";

interface CompanyCardProps {
  id: string;
  name: string;
  description: string;
  city: string;
  reviewStats: CompanyReviewStats;
  /** Краткая подпись на превью (например первая категория + «+2») */
  overlayLabel: string;
  /** Полный список категорий — под описанием, не перекрывает обложку */
  categoriesLine: string;
  imageUrl?: string;
  isVerified?: boolean;
}

const CompanyCard = ({
  id,
  name,
  description,
  city,
  reviewStats,
  overlayLabel,
  categoriesLine,
  imageUrl,
  isVerified,
}: CompanyCardProps) => {
  return (
    <Link to={`/company/${id}`}>
      <Card className="group hover-lift cursor-pointer h-full border-2 border-transparent hover:border-primary/20 transition-all duration-300 overflow-hidden">
        <CardHeader className="p-0">
          <div className="aspect-video relative overflow-hidden bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 via-secondary/5 to-muted">
                <span className="text-5xl font-black text-primary/15 group-hover:text-primary/25 transition-colors duration-300">
                  {name.charAt(0)}
                </span>
              </div>
            )}
            {overlayLabel ? (
              <Badge className="absolute top-3 right-3 max-w-[min(12rem,55%)] truncate rounded-lg font-medium shadow-md text-xs">
                {overlayLabel}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{name}</h3>
            {isVerified ? <VerifiedBadge /> : null}
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{description}</p>
          {categoriesLine ? (
            <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed" title={categoriesLine}>
              {categoriesLine}
            </p>
          ) : (
            <div className="mb-4" />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{city}</span>
            </div>

            <CompanyRatingBadge stats={reviewStats} className="bg-primary/10 px-2.5 py-1 rounded-lg shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CompanyCard;
