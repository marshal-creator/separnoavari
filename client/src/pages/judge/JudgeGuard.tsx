import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spin } from "antd";
import api from "../../service/api";

export default function JudgeGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/judge/me", { withCredentials: true });
        if (mounted) setIsAuthed(Boolean(res.data?.judge));
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!isAuthed) return <Navigate to="/panel/judge/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

