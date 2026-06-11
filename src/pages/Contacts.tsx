import { Mail, MapPin, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import InfoPageLayout from "@/components/InfoPageLayout";

const Contacts = () => {
  const { t } = useTranslation("info");
  const topics = t("contactsPage.topics.items", { returnObjects: true }) as string[];

  return (
    <InfoPageLayout title={t("contactsPage.title")} description={t("contactsPage.subtitle")}>
      <p>{t("contactsPage.intro")}</p>

      <div className="grid gap-4 sm:grid-cols-1">
        <div className="flex gap-4 rounded-xl border bg-card p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">{t("contactsPage.email.title")}</p>
            <a href="mailto:support@buildconnect.kz" className="text-primary hover:underline">
              support@buildconnect.kz
            </a>
            <p className="text-sm mt-1">{t("contactsPage.email.hint")}</p>
          </div>
        </div>

        <div className="flex gap-4 rounded-xl border bg-card p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">{t("contactsPage.region.title")}</p>
            <p>{t("contactsPage.region.value")}</p>
            <p className="text-sm mt-1">{t("contactsPage.region.hint")}</p>
          </div>
        </div>

        <div className="flex gap-4 rounded-xl border bg-card p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">{t("contactsPage.hours.title")}</p>
            <p>{t("contactsPage.hours.value")}</p>
            <p className="text-sm mt-1">{t("contactsPage.hours.hint")}</p>
          </div>
        </div>
      </div>

      <section className="space-y-3 pt-2">
        <h2 className="text-xl font-semibold text-foreground">{t("contactsPage.topics.title")}</h2>
        <ul className="list-disc pl-5 space-y-2">
          {topics.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </InfoPageLayout>
  );
};

export default Contacts;
