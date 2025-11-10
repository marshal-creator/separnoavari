import { Button } from "antd";
import styles from "./header.module.scss";
import type { Lang } from "./types";
import { useAuth } from "../../../contexts/AuthProvider";
import { RxExit } from "react-icons/rx";
import { useTranslation } from "react-i18next";

type Props = {
  isAuthenticated: boolean;
  ctaLabel: string;
  onSubmitIdea?: () => void;
  onLoginClick?: () => void;
  lang: Lang;
  loginHref?: string;
  signupHref?: string;
  accountHref?: string;
  authUser?: unknown;
};

export default function Actions({
  onLoginClick,
  loginHref = "/login",
  accountHref = "/account",
}: Props) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  if (user) {
    return (
      <div className={styles.actions}>
        <Button className={styles.primaryCta} type="primary" href={"/submit"}>
          {t("submit.title")}
        </Button>
        <Button className={styles.secondary} href={accountHref}>
          {t("nav.account")}
        </Button>
        <Button
          className={styles.primaryCta}
          type="primary"
          onClick={() => logout()}
        >
          <RxExit size={20} />
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.actions}>
      <Button className={styles.primaryCta} type="primary" href={loginHref}>
        {t("submit.title")}
      </Button>
      <Button
        className={styles.secondary}
        href={loginHref}
        onClick={onLoginClick}
      >
        {t("nav.login")}
      </Button>
    </div>
  );
}
