import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  description: string;
}

const CategoryCard = ({ title, icon: Icon, href, description }: CategoryCardProps) => {
  return (
    <Link to={href}>
      <Card className="group hover-lift cursor-pointer border-2 border-transparent hover:border-primary/20 transition-all duration-300">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <div className="rounded-2xl bg-primary/10 p-5 group-hover:bg-primary transition-colors duration-300">
            <Icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CategoryCard;
