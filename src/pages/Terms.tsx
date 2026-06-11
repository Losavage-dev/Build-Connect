import { Link } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import InfoPageLayout from "@/components/InfoPageLayout";

const linkClass = "text-primary font-medium hover:underline";

const sectionKeys = [
  "general",
  "registration",
  "content",
  "deals",
  "reviews",
  "liability",
  "changes",
  "contacts",
] as const;

const Terms = () => {
  const { t } = useTranslation("info");

  const contactLinks = {
    contactsLink: <Link to="/contacts" className={linkClass} />,
    emailLink: (
      <a href="mailto:support@buildconnect.kz" className={linkClass} />
    ),
  };

  return (
    <InfoPageLayout title={t("termsPage.title")} description={t("termsPage.subtitle")}>
      <p className="text-sm">{t("termsPage.published")}</p>

      {sectionKeys.map((key) => (
        <section key={key} className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            {t(`termsPage.sections.${key}.title`)}
          </h2>
          {key === "contacts" ? (
            <p>
              <Trans
                i18nKey="termsPage.sections.contacts.text"
                ns="info"
                components={contactLinks}
              />
            </p>
          ) : (
            <p>{t(`termsPage.sections.${key}.text`)}</p>
          )}
        </section>
      ))}
    </InfoPageLayout>
  );
};

export default Terms;
