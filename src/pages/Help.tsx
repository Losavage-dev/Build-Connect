import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import InfoPageLayout from "@/components/InfoPageLayout";

const linkClass = "text-primary font-medium hover:underline";

type TableRow = {
  action: string;
  guest: string;
  loggedIn: string;
  hasCompany: string;
};

type TableHeaders = {
  action: string;
  guest: string;
  loggedIn: string;
  hasCompany: string;
};

const Help = () => {
  const { t } = useTranslation("info");

  const headers = t("helpPage.table.headers", { returnObjects: true }) as TableHeaders;
  const rows = t("helpPage.table.rows", { returnObjects: true }) as TableRow[];

  const onboardingLinks = {
    strong: <strong className="text-foreground" />,
    createCompanyLink: <Link to="/create-company" className={linkClass} />,
    profileLink: <Link to="/profile" className={linkClass} />,
  };

  const catalogLink = {
    catalogLink: <Link to="/catalog" className={linkClass} />,
  };

  const profileLink = {
    profileLink: <Link to="/profile" className={linkClass} />,
  };

  const tendersLink = {
    strong: <strong className="text-foreground" />,
    tendersLink: <Link to="/tenders" className={linkClass} />,
  };

  const contactsLink = {
    contactsLink: <Link to="/contacts" className={linkClass} />,
  };

  return (
    <InfoPageLayout title={t("helpPage.title")} description={t("helpPage.subtitle")}>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("helpPage.gettingStarted.title")}</h2>
        <p>
          <Trans
            i18nKey="helpPage.gettingStarted.text"
            ns="info"
            components={onboardingLinks}
          />
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{t("helpPage.roles.title")}</h2>
        <p className="text-muted-foreground text-sm">{t("helpPage.roles.intro")}</p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">{headers.action}</th>
                <th className="text-left p-3 font-semibold">{headers.guest}</th>
                <th className="text-left p-3 font-semibold">{headers.loggedIn}</th>
                <th className="text-left p-3 font-semibold">{headers.hasCompany}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.action}>
                  <td className="p-3">{row.action}</td>
                  <td className="p-3">{row.guest}</td>
                  <td className="p-3">{row.loggedIn}</td>
                  <td className="p-3">{row.hasCompany}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">{t("helpPage.roles.footnote")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("helpPage.search.title")}</h2>
        <p>
          <Trans i18nKey="helpPage.search.text" ns="info" components={catalogLink} />
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("helpPage.requests.title")}</h2>
        <p>
          <Trans i18nKey="helpPage.requests.main" ns="info" components={profileLink} />
        </p>
        <p className="text-sm text-muted-foreground">{t("helpPage.requests.outgoing")}</p>
        <p className="text-sm text-muted-foreground">
          <Trans
            i18nKey="helpPage.requests.templates"
            ns="info"
            components={{ strong: <strong className="text-foreground" /> }}
          />
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("helpPage.tenders.title")}</h2>
        <p>
          <Trans i18nKey="helpPage.tenders.text" ns="info" components={tendersLink} />
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("helpPage.reviews.title")}</h2>
        <p>
          <Trans i18nKey="helpPage.reviews.rating" ns="info" components={{ strong: <strong className="text-foreground" /> }} />
        </p>
        <p>
          <Trans
            i18nKey="helpPage.reviews.leave"
            ns="info"
            components={{ strong: <strong className="text-foreground" /> }}
          />
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("helpPage.verification.title")}</h2>
        <p>
          <Trans i18nKey="helpPage.verification.process" ns="info" components={{ strong: <strong className="text-foreground" /> }} />
        </p>
        <p className="text-sm text-muted-foreground">{t("helpPage.verification.timing")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("helpPage.reports.title")}</h2>
        <p>{t("helpPage.reports.text")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("helpPage.companyManagement.title")}</h2>
        <p>{t("helpPage.companyManagement.text")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("helpPage.troubleshooting.title")}</h2>
        <p>
          <Trans i18nKey="helpPage.troubleshooting.text" ns="info" components={contactsLink} />
        </p>
      </section>
    </InfoPageLayout>
  );
};

export default Help;
