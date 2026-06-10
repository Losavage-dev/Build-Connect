import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, ExternalLink, GitCompare, Loader2, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { PageHero, PageContent, EmptyState } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import CompanyRatingBadge from "@/components/CompanyRatingBadge";
import QueryErrorBlock from "@/components/QueryErrorBlock";
import { useCompaniesCompareData, type CompanyCompareRow } from "@/hooks/useCompaniesCompareData";
import { useCompanyCompare } from "@/hooks/useCompanyCompare";
import { companyCompareIdsParam } from "@/lib/companyCompare";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canViewCompanyPrivateDetails } from "@/lib/companyContactAccess";
import { CompanyPrivateDetailsGate } from "@/components/CompanyPrivateDetailsGate";

type CompareField = {
  label: string;
  render: (row: CompanyCompareRow) => React.ReactNode;
};

const PUBLIC_FIELDS: CompareField[] = [
  { label: "Город", render: (r) => r.city },
  { label: "Категории", render: (r) => r.categoriesLine || "—" },
  {
    label: "Рейтинг",
    render: (r) => (
      <CompanyRatingBadge
        stats={{
          count: r.reviewCount,
          averageRating: r.averageRating,
          hasReviews: r.reviewCount > 0,
        }}
        className="inline-flex"
      />
    ),
  },
  { label: "Отзывов", render: (r) => r.reviewCount },
  { label: "Верификация", render: (r) => (r.isVerified ? <VerifiedBadge /> : "Не проверено") },
  { label: "Услуги на витрине", render: (r) => r.servicesCount },
  { label: "Материалы на витрине", render: (r) => r.materialsCount },
  { label: "Проектов в портфолио", render: (r) => r.portfolioCount },
];

const PRIVATE_FIELDS: CompareField[] = [
  { label: "БИН", render: (r) => r.bin || "—" },
  { label: "Телефон", render: (r) => r.phone || "—" },
  {
    label: "Сайт",
    render: (r) =>
      r.website ? (
        <a href={r.website.startsWith("http") ? r.website : `https://${r.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
          Открыть <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        "—"
      ),
  },
];

const DESCRIPTION_FIELD: CompareField = {
  label: "Описание",
  render: (r) => <span className="text-sm leading-relaxed">{r.description}</span>,
};

const CompanyCompare = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { entries, clear } = useCompanyCompare();
  const canViewPrivate = canViewCompanyPrivateDetails(!!user);
  const returnTo = `/catalog/compare${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const fields = useMemo(
    () => [...PUBLIC_FIELDS, ...(canViewPrivate ? PRIVATE_FIELDS : []), DESCRIPTION_FIELD],
    [canViewPrivate],
  );

  const idsFromUrl = useMemo(() => {
    const raw = searchParams.get("ids");
    if (!raw) return [];
    return raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  }, [searchParams]);

  const ids = idsFromUrl.length >= 2 ? idsFromUrl : entries.map((e) => e.id);
  const { data, isLoading, isError, error, refetch } = useCompaniesCompareData(ids);

  const handleClear = () => {
    clear();
    navigate("/catalog", { replace: true });
  };

  useEffect(() => {
    if (idsFromUrl.length >= 2) return;
    if (entries.length >= 2) {
      navigate(`/catalog/compare?ids=${companyCompareIdsParam(entries)}`, { replace: true });
    }
  }, [entries, idsFromUrl.length, navigate]);

  return (
    <div className="min-h-screen bg-background pb-8">
      <Navbar />

      <PageHero
        eyebrow="Каталог"
        eyebrowIcon={GitCompare}
        title="Сравнение компаний"
        description="Сопоставьте до 3 компаний по рейтингу, витрине и контактам"
        compact
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link to="/catalog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              К каталогу
            </Link>
          </Button>
        }
      />

      <PageContent>
        {ids.length < 2 ? (
          <EmptyState
            icon={Building2}
            title="Выберите минимум 2 компании"
            description="Отметьте компании в каталоге кнопкой «В сравнение», затем нажмите «Сравнить»"
            action={
              <Button asChild className="rounded-xl">
                <Link to="/catalog">Перейти в каталог</Link>
              </Button>
            }
          />
        ) : null}

        {ids.length >= 2 && isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : null}

        {ids.length >= 2 && isError ? <QueryErrorBlock error={error} onRetry={() => refetch()} /> : null}

        {ids.length >= 2 && data && data.length > 0 ? (
          <div className="space-y-4">
            {!canViewPrivate ? (
              <CompanyPrivateDetailsGate isAuthenticated={false} returnTo={returnTo} compact={false} />
            ) : null}
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left p-4 font-medium w-44 shrink-0">Параметр</th>
                    {data.map((company) => (
                      <th key={company.id} className="text-left p-4 font-semibold align-top min-w-[200px]">
                        <Link to={`/company/${company.id}`} className="hover:text-primary transition-colors">
                          {company.name}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.label} className="border-b last:border-b-0">
                      <td className="p-4 font-medium text-muted-foreground align-top">{field.label}</td>
                      {data.map((company) => (
                        <td key={`${company.id}-${field.label}`} className="p-4 align-top">
                          {field.render(company)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              {data.map((company) => (
                <Button key={company.id} asChild variant="outline" className="rounded-xl">
                  <Link to={`/company/${company.id}`}>Профиль: {company.name}</Link>
                </Button>
              ))}
              <Button type="button" variant="outline" className="rounded-xl" onClick={handleClear}>
                <X className="h-4 w-4 mr-2" />
                Очистить сравнение
              </Button>
            </div>
          </div>
        ) : null}

        {ids.length >= 2 && !isLoading && !isError && data?.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Компании не найдены"
            description="Возможно, профиль скрыт или снят с публикации. Выберите другие компании в каталоге."
            action={
              <Button asChild className="rounded-xl">
                <Link to="/catalog">К каталогу</Link>
              </Button>
            }
          />
        ) : null}
      </PageContent>
    </div>
  );
};

export default CompanyCompare;
