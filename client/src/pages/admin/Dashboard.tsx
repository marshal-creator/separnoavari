import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listIdeas, listJudges, listAssignments } from "../../api";
import type { Idea, Judge, Assignment } from "../../api";
import s from "../../styles/panel.module.scss";

export default function Dashboard() {
  const { t } = useTranslation();
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [judges, setJudges] = useState<Judge[] | null>(null);
  const [assigns, setAssigns] = useState<Assignment[] | null>(null);

  useEffect(() => {
    listIdeas().then(setIdeas).catch(()=>setIdeas([]));
    listJudges().then(setJudges).catch(()=>setJudges([]));
    listAssignments().then(setAssigns).catch(()=>setAssigns([]));
  }, []);

  const totals = {
    ideas: ideas?.length || 0,
    judges: judges?.length || 0,
    assignments: assigns?.length || 0,
  };

  const ideasByStatus = useMemo(() => {
    const map: Record<string, number> = { PENDING: 0, UNDER_REVIEW: 0, ACCEPTED: 0, REJECTED: 0 };
    (ideas || []).forEach(i => { map[i.status] = (map[i.status] || 0) + 1; });
    return map;
  }, [ideas]);

  const submissionsOverTime = useMemo(() => {
    // group by month YYYY-MM for a simple line
    const buckets = new Map<string, number>();
    (ideas || []).forEach(i => {
      const d = new Date(i.submittedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    const sortedKeys = Array.from(buckets.keys()).sort();
    return sortedKeys.map(k => ({ label: k, value: buckets.get(k) || 0 }));
  }, [ideas]);

  const unassignedCount = useMemo(() => {
    if (!ideas) return 0;
    const assignedIdeaIds = new Set((assigns || []).map(a => a.ideaId));
    return ideas.filter(i => !assignedIdeaIds.has(i.id)).length;
  }, [ideas, assigns]);

  // Simple bar and line chart render helpers
  const BarChart = ({ data }: { data: { label: string; value: number }[] }) => {
    const max = Math.max(1, ...data.map(d => d.value));
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: "grid", gridTemplateColumns: "140px 1fr auto", alignItems: "center", gap: 8 }}>
            <div className={s.muted}>{d.label}</div>
            <div style={{ background: "#1f2937", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: `${(d.value/max)*100}%`, background: "var(--primary)", height: 10 }} />
            </div>
            <div style={{ textAlign: "end" }}>{d.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const LineChart = ({ points }: { points: { label: string; value: number }[] }) => {
    const max = Math.max(1, ...points.map(p => p.value));
    const width = 520; const height = 160; const padding = 24;
    const step = points.length > 1 ? (width - padding*2) / (points.length - 1) : 0;
    const xy = points.map((p, idx) => {
      const x = padding + idx * step;
      const y = height - padding - (p.value / max) * (height - padding*2);
      return { x, y };
    });
    const d = xy.map((p, i) => `${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
    return (
      <svg width={width} height={height} style={{ width: "100%", height: "180px" }}>
        <polyline fill="none" stroke="var(--primary)" strokeWidth="2" points={xy.map(p=>`${p.x},${p.y}`).join(" ")} />
      </svg>
    );
  };

  return (
    <div className={s.stack}>
      <h1>{t("admin.dashboard.title", { defaultValue: "Dashboard" })}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(37,99,235,.2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>💡</span>
            <div><div className={s.muted}>{t("admin.dashboard.cards.ideas")}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{totals.ideas}</div></div>
          </div>
        </div></div>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,.2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>🧑‍⚖️</span>
            <div><div className={s.muted}>{t("admin.dashboard.cards.judges")}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{totals.judges}</div></div>
          </div>
        </div></div>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,.2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>📝</span>
            <div><div className={s.muted}>{t("admin.dashboard.cards.assignments")}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{totals.assignments}</div></div>
          </div>
        </div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("admin.dashboard.charts.byStatus")}</div>
          <BarChart data={[
            { label: t("admin.status.pending"), value: ideasByStatus["PENDING"] || 0 },
            { label: t("admin.status.underReview"), value: ideasByStatus["UNDER_REVIEW"] || 0 },
            { label: t("admin.status.accepted"), value: ideasByStatus["ACCEPTED"] || 0 },
            { label: t("admin.status.rejected"), value: ideasByStatus["REJECTED"] || 0 },
          ]} />
        </div></div>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("admin.dashboard.charts.overTime")}</div>
          <LineChart points={submissionsOverTime} />
        </div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("admin.dashboard.recent.title")}</div>
          <div className={s.stack}>
            {(ideas || []).slice(0, 6).map(i => (
              <div key={i.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>🆕</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{i.title}</div>
                  <div className={s.muted}>{t("admin.dashboard.recent.ideaSubmitted")}</div>
                </div>
                <div className={s.muted}>{new Date(i.submittedAt).toLocaleString()}</div>
              </div>
            ))}
            {(ideas || []).length === 0 && <div className={s.muted}>{t("admin.dashboard.recent.empty")}</div>}
          </div>
        </div></div>
        <div className={s.card}><div className={s.cardBody}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("admin.dashboard.notifications.title")}</div>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ border: "1px solid var(--panel-border)", borderRadius: 10, padding: 10, background: "rgba(239,68,68,.08)" }}>
              <strong>{unassignedCount}</strong> {t("admin.dashboard.notifications.unassigned")}
            </div>
          </div>
        </div></div>
      </div>
    </div>
  );
}
