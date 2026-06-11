import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function DocumentTitle() {
  const { t, i18n } = useTranslation("common");

  useEffect(() => {
    document.title = t("documentTitle");
  }, [t, i18n.language]);

  return null;
}
