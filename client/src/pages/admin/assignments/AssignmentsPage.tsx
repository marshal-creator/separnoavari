import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listIdeas, listJudges, listAssignments } from "../../../api";
import type { Idea, Judge, Assignment } from "../../../api";
import s from "../../../styles/panel.module.scss";
import { AssignmentsToolbar } from "./AssignmentsToolbar";
import { AssignmentsTable } from "./AssignmentsTable";
import { AssignmentsSplitView } from "./AssignmentsSplitView";

export type UiAssignment = {
  id: string;
  ideaId: string;
  ideaTitle: string;
  category?: string;
  submitter?: string;
  status: "UNASSIGNED" | "ASSIGNED" | "REVIEWED";
  judges: { id: string; name: string; assignedCount?: number; capacity?: number }[];
  brief?: { pdfUrl?: string; uploadedBy?: string; uploadedAt?: string };
  createdAt: string;
};

export function AssignmentsPage() {
  const { t } = useTranslation();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [assignments, setAssignments] = useState<UiAssignment[]>([]);
  const [view, setView] = useState<"table" | "split">("table");

  // Filters
  const [status, setStatus] = useState<"ALL" | "UNASSIGNED" | "ASSIGNED" | "REVIEWED">("ALL");
  const [judgeFilter, setJudgeFilter] = useState<string[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [i, j, a] = await Promise.all([listIdeas(), listJudges(), listAssignments()]);
        setIdeas(i);
        setJudges(j as any);
        // Adapt minimal Assignment[] to UiAssignment list
        const adapted: UiAssignment[] = (a as any[]).map((x) => ({
          id: String((x as any).id || (x as any)._id || `${(x as any).ideaId}-${(x as any).judgeId}`),
          ideaId: String((x as any).ideaId || (x as any).id),
          ideaTitle: (i.find(ii => ii.id === ((x as any).ideaId || (x as any).id))?.title) || t("admin.assignments.untitled"),
          category: undefined,
          submitter: undefined,
          status: ((x as any).status === "DONE" ? "REVIEWED" : ((x as any).judgeId ? "ASSIGNED" : "UNASSIGNED")) as UiAssignment["status"],
          judges: (x as any).judgeId ? [{ id: String((x as any).judgeId), name: (j as any[]).find(jj=>String(jj.id)===String((x as any).judgeId))?.name || "" }] : [],
          createdAt: new Date().toISOString(),
        }));
        setAssignments(adapted);
      } catch {
        setIdeas([]); setJudges([]); setAssignments([]);
      }
    })();
  }, [t]);

  const filtered = useMemo(() => {
    let rows = [...assignments];
    if (status !== "ALL") rows = rows.filter(r => r.status === status);
    if (judgeFilter.length) rows = rows.filter(r => r.judges.some(j => judgeFilter.includes(j.id)));
    if (q.trim()) {
      const qq = q.toLowerCase();
      rows = rows.filter(r => r.ideaTitle.toLowerCase().includes(qq) || (r.submitter||"").toLowerCase().includes(qq));
    }
    return rows;
  }, [assignments, status, judgeFilter, q]);

  return (
    <div className={s.stack}>
      <h1>{t("admin.assignments.title")}</h1>

      <AssignmentsToolbar
        status={status}
        onStatusChange={setStatus}
        judges={judges}
        judgeFilter={judgeFilter}
        onJudgeFilterChange={setJudgeFilter}
        q={q}
        onQChange={setQ}
        view={view}
        onToggleView={() => setView(v => v === "table" ? "split" : "table")}
      />

      {view === "table" ? (
        <AssignmentsTable rows={filtered} allJudges={judges} />
      ) : (
        <AssignmentsSplitView rows={filtered} allJudges={judges} />
      )}
    </div>
  );
}

export default AssignmentsPage;


