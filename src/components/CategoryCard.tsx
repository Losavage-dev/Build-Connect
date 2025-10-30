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
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <div className="rounded-full bg-primary/10 p-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="h-8 w-8 text-primary group-hover:text-primary-foreground" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CategoryCard;
