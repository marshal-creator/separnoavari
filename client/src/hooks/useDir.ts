import { useEffect } from 'react';
import i18n from '../AppData/i18n/i18n';

export function useDir() {
  useEffect(() => {
    const dir = i18n.language === "fa" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", i18n.language);
  }, [i18n.language]);
}