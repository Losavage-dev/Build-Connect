import { useState } from "react";
import { Building2, Calendar, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatDisplayDate,
  formatProjectPeriod,
  IMAGE_ROLE_LABEL,
  PROJECT_PHASE_LABEL,
  sortProjectImages,
} from "@/lib/portfolio";

export type PortfolioProject = {
  id: string;
  title: string;
  description?: string | null;
  start_date?: string | null;
  completion_date?: string | null;
  project_phase?: string | null;
  project_images?: Array<{
    id: string;
    image_url: string;
    caption?: string | null;
    image_role?: string | null;
    order_index?: number | null;
  }>;
};

type Props = {
  project: PortfolioProject;
};

export function PortfolioProjectCard({ project }: Props) {
  const [open, setOpen] = useState(false);
  const sortedImgs =
    project.project_images?.length ? sortProjectImages(project.project_images) : [];
  const cover = sortedImgs[0];
  const period = formatProjectPeriod(project.start_date, project.completion_date);
  const phaseLabel = project.project_phase
    ? PROJECT_PHASE_LABEL[project.project_phase] || project.project_phase
    : null;

  return (
    <>
      <Card
        className="overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group"
        onClick={() => setOpen(true)}
      >
        {cover ? (
          <div className="aspect-[16/10] overflow-hidden relative">
            <img
              src={cover.image_url}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
            {cover.image_role && cover.image_role !== "gallery" ? (
              <span className="absolute bottom-2 left-2 rounded-md bg-black/65 text-white text-xs px-2 py-0.5">
                {IMAGE_ROLE_LABEL[cover.image_role] || cover.image_role}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="aspect-[16/10] bg-muted flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-snug line-clamp-2">{project.title}</h3>
            {phaseLabel ? (
              <Badge
                variant={project.project_phase === "completed" ? "default" : "secondary"}
                className="shrink-0 text-xs"
              >
                {phaseLabel}
              </Badge>
            ) : null}
          </div>
          {period ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {period}
            </p>
          ) : project.completion_date ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              Завершён {formatDisplayDate(project.completion_date)}
            </p>
          ) : null}
          {project.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
          ) : null}
          {sortedImgs.length > 1 ? (
            <p className="text-xs text-primary font-medium">+{sortedImgs.length - 1} фото · подробнее</p>
          ) : (
            <p className="text-xs text-primary font-medium">Подробнее</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{project.title}</DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-wrap gap-2 pt-1">
                {phaseLabel ? <Badge variant="outline">{phaseLabel}</Badge> : null}
                {project.start_date ? (
                  <Badge variant="outline" className="font-normal">
                    Старт: {formatDisplayDate(project.start_date)}
                  </Badge>
                ) : null}
                {project.completion_date ? (
                  <Badge variant="outline" className="font-normal">
                    Завершение: {formatDisplayDate(project.completion_date)}
                  </Badge>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          {project.description ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
          ) : null}
          {sortedImgs.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {sortedImgs.map((img) => (
                <div key={img.id} className="rounded-lg overflow-hidden border relative">
                  <img src={img.image_url} alt="" className="w-full aspect-video object-cover" />
                  {img.image_role && img.image_role !== "gallery" ? (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {IMAGE_ROLE_LABEL[img.image_role] || img.image_role}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Building2 className="h-5 w-5" />
              Фотографии не добавлены
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
