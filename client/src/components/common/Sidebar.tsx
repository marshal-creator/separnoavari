import { NavLink } from "react-router-dom";
import type { NavLinkProps } from "react-router-dom";
import { useTranslation } from "react-i18next";
import panelStyles from "../../styles/panel.module.scss";
import styles from "./sidebar.module.scss";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LogoutButton } from "./LogoutButton";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { t } = useTranslation();

  const handleNavigate = () => {
    if (isOpen && onClose) onClose();
  };

  const getNavClassName: NavLinkProps["className"] = ({ isActive }) =>
    isActive
      ? `${panelStyles.navLink} ${panelStyles.navLinkActive}`
      : panelStyles.navLink;

  const menuItems: Array<{ to: string; label: string; end?: boolean }> = [
    { to: ".", label: t("adminMenu.dashboard"), end: true },
    { to: "ideas", label: t("adminMenu.ideas") },
    { to: "judges", label: t("adminMenu.judges") },
    // { to: "assignments", label: t("adminMenu.assignments") },
    { to: "ranking", label: t("adminMenu.ranking") },
    { to: "users", label: t("adminMenu.users") },
  ];

  return (
    <aside
      className={`${panelStyles.sidebar} ${styles.sidebar}`}
      aria-label="Admin sidebar"
      id="admin-sidebar"
      data-open={isOpen}
    >
      <nav className={styles.menu} aria-label="Main navigation">
        <ul className={panelStyles.navList}>
          {menuItems.map((item) => (
            <li key={item.to} className={panelStyles.navItem}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={handleNavigate}
                className={getNavClassName}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.sidebarBottom}>
        <LanguageSwitcher className={styles.sidebarBtn} />
        <LogoutButton className={styles.sidebarBtn} />
      </div>
    </aside>
  );
}
