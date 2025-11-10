import { GlobalOutlined } from "@ant-design/icons";
import { Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { useTranslation } from "react-i18next";

type SupportedLang = "en" | "fa";

type LanguageSwitcherProps = {
  className?: string;
};

const LABELS: Record<SupportedLang, string> = {
  en: "EN",
  fa: "\u0641\u0627",
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: SupportedLang) => {
    if (i18n.language.startsWith(lang)) return;
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const items: MenuProps["items"] = [
    {
      key: "en",
      label: t("common.english"),
      onClick: () => handleLanguageChange("en"),
    },
    {
      key: "fa",
      label: t("common.persian"),
      onClick: () => handleLanguageChange("fa"),
    },
  ];

  const currentLang: SupportedLang = i18n.language.startsWith("fa") ? "fa" : "en";
  const currentLabel = LABELS[currentLang];

  return (
    <Dropdown menu={{ items }} placement="topLeft" trigger={["click"]} arrow>
      <Button
        type="text"
        icon={<GlobalOutlined />}
        className={className}
        aria-label={t("common.language")}
        title={t("common.language")}
      >
        {currentLabel}
      </Button>
    </Dropdown>
  );
}
