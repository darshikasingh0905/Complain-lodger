import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { TRANSLATIONS, LANGUAGES } from "../i18n/translations";

/**
 * Site-wide language switcher (USP: a government portal must not assume
 * English). The picked language persists per browser and re-renders the
 * whole UI instantly. `t(key)` falls back to English, then to the key, so
 * partially translated pages can never break.
 */

const KEY = "ui_language";

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(KEY);
    return TRANSLATIONS[saved] ? saved : "en";
  });

  useEffect(() => {
    localStorage.setItem(KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key) => TRANSLATIONS[language]?.[key] ?? TRANSLATIONS.en[key] ?? key,
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
};

export default LanguageContext;
