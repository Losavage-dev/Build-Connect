import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import InfoPageLayout from "@/components/InfoPageLayout";

const linkClass = "text-primary font-medium hover:underline";

const About = () => {
  const { t } = useTranslation("info");

  const featureLinks = {
    catalogLink: <Link to="/catalog" className={linkClass} />,
    servicesLink: <Link to="/services" className={linkClass} />,
    materialsLink: <Link to="/materials" className={linkClass} />,
    tendersLink: <Link to="/tenders" className={linkClass} />,
    feedLink: <Link to="/feed" className={linkClass} />,
    contactsLink: <Link to="/contacts" className={linkClass} />,
  };

  return (
    <InfoPageLayout title={t("aboutPage.title")} description={t("aboutPage.subtitle")}>
      <p>{t("aboutPage.intro")}</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("aboutPage.audience.title")}</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-foreground">{t("aboutPage.audience.customers.label")}</strong>{" "}
            {t("aboutPage.audience.customers.text")}
          </li>
          <li>
            <strong className="text-foreground">{t("aboutPage.audience.contractors.label")}</strong>{" "}
            {t("aboutPage.audience.contractors.text")}
          </li>
          <li>
            <strong className="text-foreground">{t("aboutPage.audience.suppliers.label")}</strong>{" "}
            {t("aboutPage.audience.suppliers.text")}
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("aboutPage.features.title")}</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <Trans i18nKey="aboutPage.features.catalog" ns="info" components={featureLinks} />
          </li>
          <li>
            <Trans i18nKey="aboutPage.features.servicesMaterials" ns="info" components={featureLinks} />
          </li>
          <li>
            <Trans i18nKey="aboutPage.features.tenders" ns="info" components={featureLinks} />
          </li>
          <li>
            <Trans i18nKey="aboutPage.features.feed" ns="info" components={featureLinks} />
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("aboutPage.goal.title")}</h2>
        <p>{t("aboutPage.goal.text")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">{t("aboutPage.feedback.title")}</h2>
        <p>
          <Trans i18nKey="aboutPage.feedback.text" ns="info" components={featureLinks} />
        </p>
      </section>
    </InfoPageLayout>
  );
};

export default About;
