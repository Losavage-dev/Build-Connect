import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ruCommon from "./locales/ru/common.json";
import ruNav from "./locales/ru/nav.json";
import ruHome from "./locales/ru/home.json";
import ruAuth from "./locales/ru/auth.json";
import ruMarketplace from "./locales/ru/marketplace.json";
import ruProfile from "./locales/ru/profile.json";
import ruInfo from "./locales/ru/info.json";
import ruValidation from "./locales/ru/validation.json";
import ruCatalogData from "./locales/ru/catalogData.json";
import ruRecommendations from "./locales/ru/recommendations.json";

import enCommon from "./locales/en/common.json";
import enNav from "./locales/en/nav.json";
import enHome from "./locales/en/home.json";
import enAuth from "./locales/en/auth.json";
import enMarketplace from "./locales/en/marketplace.json";
import enProfile from "./locales/en/profile.json";
import enInfo from "./locales/en/info.json";
import enValidation from "./locales/en/validation.json";
import enCatalogData from "./locales/en/catalogData.json";
import enRecommendations from "./locales/en/recommendations.json";

export const SUPPORTED_LANGUAGES = ["ru", "en"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  ru: "Русский",
  en: "English",
};

const STORAGE_KEY = "bc_language";

function syncDocumentLanguage(lng: string) {
  document.documentElement.lang = lng === "en" ? "en" : "ru";
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: {
        common: ruCommon,
        nav: ruNav,
        home: ruHome,
        auth: ruAuth,
        marketplace: ruMarketplace,
        profile: ruProfile,
        info: ruInfo,
        validation: ruValidation,
        catalogData: ruCatalogData,
        recommendations: ruRecommendations,
      },
      en: {
        common: enCommon,
        nav: enNav,
        home: enHome,
        auth: enAuth,
        marketplace: enMarketplace,
        profile: enProfile,
        info: enInfo,
        validation: enValidation,
        catalogData: enCatalogData,
        recommendations: enRecommendations,
      },
    },
    fallbackLng: "ru",
    supportedLngs: [...SUPPORTED_LANGUAGES],
    defaultNS: "common",
    ns: [
      "common",
      "nav",
      "home",
      "auth",
      "marketplace",
      "profile",
      "info",
      "validation",
      "catalogData",
      "recommendations",
    ],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

i18n.on("languageChanged", syncDocumentLanguage);
syncDocumentLanguage(i18n.language);

export function setAppLanguage(lng: AppLanguage) {
  void i18n.changeLanguage(lng);
  localStorage.setItem(STORAGE_KEY, lng);
}

export default i18n;
