import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import { useEffect } from "react";
// import { useAuth } from "../contexts/AuthContext";

export default function DefaultLayout() {
  const loc = useLocation();
  // const { isAuthenticated } = useAuth();

  // Scroll to top on route change, but skip if navigating to home with a hash link
  useEffect(() => {
    const hasScrollTo = (loc.state as any)?.scrollTo;
    // Don't scroll if we're navigating to home with a scroll target (Header will handle it)
    if (hasScrollTo && loc.pathname === "/") {
      return;
    }
    // Scroll to top for all other route changes
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [loc.pathname, loc.state]);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100dvh" }}>
      <Header
        loginHref="/login"
        signupHref="/signup"
        accountHref="/account"
      />
      {/* React Router handles scroll restoration between entries */}
      <ScrollRestoration />
      <Outlet />
      <Footer />
    </div>
  );
}
