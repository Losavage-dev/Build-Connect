import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { formatDisplayDate, sortProjectImages } from "@/lib/portfolio";
import { useDateFnsLocale } from "@/hooks/useAppFormat";
import { format } from "date-fns";

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
  const { t } = useTranslation(["profile", "common"]);
  const dateLocale = useDateFnsLocale();
  const [open, setOpen] = useState(false);
  const sortedImgs =
    project.project_images?.length ? sortProjectImages(project.project_images) : [];
  const cover = sortedImgs[0];

  const phaseLabel =
    project.project_phase === "in_progress"
      ? t("common:portfolio.phaseInProgress")
      : project.project_phase === "completed"
        ? t("common:portfolio.phaseCompleted")
        : null;

  const imageRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      gallery: t("common:portfolio.imageRoleGallery"),
      site_start: t("common:portfolio.imageRoleSiteStart"),
      site_end: t("common:portfolio.imageRoleSiteEnd"),
      work_in_progress: t("common:portfolio.imageRoleWork"),
    };
    return map[role] || role;
  };

  const formatDate = (value: string | null | undefined) => {
    const formatted = formatDisplayDate(value);
    if (formatted) return formatted;
    if (!value) return null;
    try {
      return format(new Date(value.length <= 10 ? `${value}T12:00:00` : value), "d MMM yyyy", { locale: dateLocale });
    } catch {
      return value;
    }
  };

  const period = (() => {
    const s = formatDate(project.start_date);
    const e = formatDate(project.completion_date);
    if (s && e) return t("common:portfolio.periodRange", { start: s, end: e });
    if (s) return t("common:portfolio.periodFrom", { date: s });
    if (e) return t("common:portfolio.periodTo", { date: e });
    return null;
  })();

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
                {imageRoleLabel(cover.image_role)}
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
              {t("portfolioCard.completedOn", { date: formatDate(project.completion_date) })}
            </p>
          ) : null}
          {project.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
          ) : null}
          {sortedImgs.length > 1 ? (
            <p className="text-xs text-primary font-medium">
              {t("portfolioCard.morePhotos", { count: sortedImgs.length - 1 })}
            </p>
          ) : (
            <p className="text-xs text-primary font-medium">{t("portfolioCard.details")}</p>
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
                    {t("portfolioCard.start", { date: formatDate(project.start_date) })}
                  </Badge>
                ) : null}
                {project.completion_date ? (
                  <Badge variant="outline" className="font-normal">
                    {t("portfolioCard.completion", { date: formatDate(project.completion_date) })}
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
                      {imageRoleLabel(img.image_role)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Building2 className="h-5 w-5" />
              {t("portfolioCard.noPhotos")}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
