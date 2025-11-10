import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../AppData/i18n";

import styles from "./header/header.module.scss";

import Brand from "./header/Brand";
import Actions from "./header/Actions";
import MobileMenu from "./header/MobileMenu";
import DashboardHeaderControls from "../layout/DashboardHeaderControls";

import type { HeaderProps, Lang, NavItem } from "./header/types";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeContext";

/** Apply html dir/lang */
function applyLangAndDir(lang: Lang) {
  const html = document.documentElement;
  html.dir = lang === "fa" ? "rtl" : "ltr";
  html.lang = lang;
}



export default function Header({
  onLoginClick,
  onSubmitIdea,
  currentLang = "fa",
  onLanguageChange,
  navItems,
  logoSrc = "/images/logo.png",
  brandTitleFa = "همایش ملی سپر نوآوری",
  brandTitleEn = "Spear Innovation Event",
  ctaLabelFa = "ثبت ایده",
  ctaLabelEn = "Submit Idea",
  loginHref = "/login",
  signupHref = "/signup",
  accountHref = "/account",
}: HeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const isAuthenticated = !!user;

  const { mode: theme } = useTheme();

  // Language
  const [lang, setLang] = useState<Lang>(currentLang);
  useEffect(() => {
    applyLangAndDir(lang);
    void i18n.changeLanguage(lang);
    onLanguageChange?.(lang);
  }, [lang, onLanguageChange]);

  // Shadow on scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 2);
          ticking = false;
        });
        ticking = true;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sync header height CSS var
  // useLayoutEffect(() => {
  //   const el = document.querySelector<HTMLElement>(`.${styles.header}`);
  //   if (!el) return;
  //   const setH = () => {
  //     document.documentElement.style.setProperty("--hdr-h", `${el.offsetHeight}px`);
  //   };
  //   setH();
  //   const ro = new ResizeObserver(setH);
  //   ro.observe(el);
  //   return () => ro.disconnect();
  // }, []);

  // Nav items
  const items: NavItem[] = useMemo(
    () =>
      navItems ?? [
        { id: "tracks",    label: t("header.tracks"),    href: "/tracks" },
        { id: "committee", label: t("header.committee"), href: "/committee" },
        { id: "calendar",  label: t("header.timeline"),  href: "#timeline" },
        { id: "prize", label: t("header.prize"), href: "#supports" },
        { id: "contact",   label: t("header.contact"),   href: "#contact" },
      ],
    [navItems, t, lang]
  );

  // Helper function to scroll to element with header offset
  const scrollToElement = useCallback((element: Element, hash: string) => {
    const headerHeight = 72; // --hdr-h from CSS
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementTop - headerHeight - 16; // 16px extra padding
    
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
    // Update URL hash
    window.history.replaceState(null, "", hash);
  }, []);

  // Router-aware navigate with scroll support for hash links
  const navigateTo = useCallback(
    (href: string, e?: React.MouseEvent) => {
      e?.preventDefault();
      
      if (href.startsWith("#")) {
        // Hash link - scroll to section
        const hash = href;
        const isOnHomePage = location.pathname === "/";
        
        if (isOnHomePage) {
          // Already on home page, scroll to section
          const element = document.querySelector(hash);
          if (element) {
            scrollToElement(element, hash);
          }
        } else {
          // Not on home page, navigate to home first, then scroll
          navigate("/", { state: { scrollTo: hash } });
        }
      } else {
        // Regular route navigation
        navigate(href);
      }
    },
    [navigate, location.pathname, scrollToElement]
  );

  const isActive = useCallback(
    (href: string) => {
      if (href.startsWith("#")) return location.hash === href;
      const norm = (p: string) => (p === "/" ? "/" : p.replace(/\/+$/, ""));
      const hrefPath = norm(href.split("#")[0]);
      const cur = norm(location.pathname);
      return cur === hrefPath || cur.startsWith(hrefPath + "/");
    },
    [location.pathname, location.hash]
  );

  // Mobile menu
  const [open, setOpen] = useState(false);
  const toggleMenu = () => setOpen((v) => !v);
  const closeMenu = () => setOpen(false);

  // Close menu on route/hash change
  useEffect(() => { if (open) closeMenu(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [location.pathname, location.hash]);

  // Handle scrolling to hash after navigation to home
  useEffect(() => {
    if (location.pathname === "/") {
      const scrollTo = (location.state as any)?.scrollTo;
      if (scrollTo && scrollTo.startsWith("#")) {
        // Wait for page to render, then scroll with retry mechanism
        const attemptScroll = (attempts = 0) => {
          const element = document.querySelector(scrollTo);
          if (element) {
            // Small delay to ensure layout is stable
            setTimeout(() => {
              scrollToElement(element, scrollTo);
            }, 50);
          } else if (attempts < 10) {
            // Retry up to 10 times (500ms total wait)
            setTimeout(() => attemptScroll(attempts + 1), 50);
          }
        };
        attemptScroll();
      } else if (location.hash) {
        // Handle direct hash in URL (e.g., page reload or direct link)
        const element = document.querySelector(location.hash);
        if (element) {
          setTimeout(() => {
            scrollToElement(element, location.hash);
          }, 100);
        }
      }
    }
  }, [location.pathname, location.state, location.hash, scrollToElement]);

  const ctaLabel   = lang === "fa" ? ctaLabelFa   : ctaLabelEn;
  const brandTitle = lang === "fa" ? brandTitleFa : brandTitleEn;

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        {/* Left: burger + brand */}
        <div className={styles.left}>
          <button
            type="button"
            className={styles.burger}
            aria-controls="mobile-menu"
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={open ? (t("header.closeMenu") || "Close menu") : (t("header.openMenu") || "Open menu")}
            onClick={toggleMenu}
          >
            <span></span><span></span><span></span>
          </button>

          <Brand
            logoSrc={logoSrc}
            title={t('nav.brandTitle')}
            onHomeNavigate={() => navigate("/")}
            lang={lang}
          />
        </div>

        {/* Center nav */}
        <nav className={styles.nav} aria-label={t("header.primaryNavigation") || "Primary"}>
          <ul className={styles.menu} aria-orientation="horizontal" role="menubar">
            {items.map((it) => (
              <li key={it.id} role="none">
                <a
                  role="menuitem"
                  href={it.href}
                  className={`${styles.menuItem} ${isActive(it.href) ? styles.isActive : ""}`}
                  aria-current={isActive(it.href) ? "page" : undefined}
                  onClick={(e) => navigateTo(it.href, e)}
                >
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right controls */}
        <div className={styles.right}>
          <DashboardHeaderControls />
          <Actions
            isAuthenticated={isAuthenticated}
            ctaLabel={ctaLabel}
            onSubmitIdea={onSubmitIdea}
            onLoginClick={onLoginClick}
            lang={lang}
            loginHref={loginHref}
            signupHref={signupHref}
            accountHref={accountHref}
            authUser={user}
          />
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileMenu
        id="mobile-menu"
        open={open}
        onClose={closeMenu}
        lang={lang}
        theme={theme}
        onLangChange={setLang}
        navItems={items}
        onNavigate={navigateTo}
        onSubmitIdea={onSubmitIdea}
        isAuthenticated={isAuthenticated}
        ctaLabel={ctaLabel}
        loginHref={loginHref}
        signupHref={signupHref}
        accountHref={accountHref}
      />
    </header>
  );
}

