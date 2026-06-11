import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { PageHero, PageContent } from "@/components/layout/PageHero";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileCompanies, usePublicProfile } from "@/hooks/usePublicProfile";
import { formatPersonName } from "@/lib/requestDisplay";
import { companyCategoryLabel } from "@/lib/companyDisplay";
import { isStaffRole, STAFF_ROLE_LABELS, USER_ROLE_LABELS } from "@/lib/userRoles";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { useCatalogLabel, useUserRoleLabel } from "@/lib/i18nCatalog";

const UserProfile = () => {
  const { t } = useTranslation(["profile", "common", "catalogData"]);
  const catalogLabel = useCatalogLabel();
  const roleLabelFn = useUserRoleLabel();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: person, isLoading, isError, error, refetch } = usePublicProfile(id);
  const { data: companies = [], isLoading: companiesLoading } = useProfileCompanies(id);

  const fullName = formatPersonName(person, t("userProfile.anonymous"));
  const roleLabel = person?.role
    ? isStaffRole(person.role)
      ? STAFF_ROLE_LABELS[person.role]
      : roleLabelFn(person.role) || person.role
    : null;

  const heroDescription =
    isLoading || !person
      ? undefined
      : [roleLabel, person.city ? catalogLabel(person.city) : null].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <PageHero
        eyebrow={t("userProfile.eyebrow")}
        title={isLoading ? t("common:loading") : fullName}
        description={heroDescription}
        compact
        actions={
          <Button variant="ghost" className="rounded-xl" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common:back")}
          </Button>
        }
      />

      <PageContent className="border-b-0">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : isError ? (
            <QueryErrorBlock error={error} onRetry={() => void refetch()} />
          ) : !person ? (
            <Card className="rounded-2xl border-border/60">
              <CardContent className="py-12 text-center text-muted-foreground">
                {t("userProfile.notFound")}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-border/60 bg-card/90 backdrop-blur overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                  <AvatarImage src={person.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                    {fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{t("userProfile.companiesTitle")}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{fullName}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {companiesLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : companies.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">{t("userProfile.noCompanies")}</p>
                ) : (
                  companies.map((company) => (
                    <Link
                      key={company.id}
                      to={`/company/${company.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border/60 p-3 hover:bg-muted/50 hover:border-primary/25 transition-colors"
                    >
                      <Avatar className="h-11 w-11 border shrink-0">
                        <AvatarImage src={company.logo_url ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{company.name}</span>
                          {company.verification_status === "verified" ? <VerifiedBadge /> : null}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {[catalogLabel(companyCategoryLabel(company.category)), catalogLabel(company.city)]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>
    </div>
  );
};

export default UserProfile;
