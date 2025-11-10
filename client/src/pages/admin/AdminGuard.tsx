import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../../service/api";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("admin/me", { withCredentials: true });
        if (mounted) setIsAuthed(Boolean(res.data?.admin));
      } catch {
        if (mounted) setIsAuthed(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (loading) return null;
  if (!isAuthed) return <Navigate to="/panel/admin/login" state={{ from: location }} replace />;
  return <>{children}</>;
}


