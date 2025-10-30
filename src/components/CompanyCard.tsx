import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CompanyCardProps {
  id: string;
  name: string;
  description: string;
  city: string;
  rating: number;
  reviewCount: number;
  category: string;
  imageUrl?: string;
}

const CompanyCard = ({
  id,
  name,
  description,
  city,
  rating,
  reviewCount,
  category,
  imageUrl,
}: CompanyCardProps) => {
  return (
    <Link to={`/company/${id}`}>
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
        <CardHeader className="p-0">
          <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/20 to-secondary/20">
                <span className="text-4xl font-bold text-muted-foreground/20">{name.charAt(0)}</span>
              </div>
            )}
            <Badge className="absolute top-3 left-3">{category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{name}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{city}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({reviewCount})</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CompanyCard;
