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
                <span className="text-5xl font-black text-primary/15 group-hover:text-primary/25 transition-colors duration-300">{name.charAt(0)}</span>
              </div>
            )}
            <Badge className="absolute top-3 left-3 rounded-lg font-semibold shadow-md">{category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <h3 className="font-bold text-lg mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">{name}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{city}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-lg">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="font-semibold text-sm text-primary">{rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CompanyCard;
