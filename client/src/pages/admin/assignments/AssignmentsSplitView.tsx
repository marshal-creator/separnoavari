import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import s from "../../../styles/panel.module.scss";
import type { UiAssignment } from "./AssignmentsPage";
import { IdeaDetailsPanel } from "./IdeaDetailsPanel";

type Props = { rows: UiAssignment[]; allJudges: { id: string; name: string }[] };

export function AssignmentsSplitView({ rows, allJudges }: Props) {
  const { t } = useTranslation();
  const [currentId, setCurrentId] = useState<string | null>(rows[0]?.id || null);
  const current = useMemo(() => rows.find(r=>r.id===currentId) || null, [rows, currentId]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 420px) 1fr', gap: 12 }}>
      <div className={s.card}>
        <div className={s.cardBody}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{t("admin.assignments.list")}</div>
          <div className={s.stack}>
            {rows.map(r=> (
              <button key={r.id} className={s.btn} style={{ justifyContent: 'space-between' }} onClick={()=>setCurrentId(r.id)} aria-pressed={currentId===r.id}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.ideaTitle}</span>
                <span className={s.muted}>{r.status}</span>
              </button>
            ))}
            {rows.length===0 && <div className={s.muted}>{t("admin.assignments.empty")}</div>}
          </div>
        </div>
      </div>
      <div className={s.card}>
        <div className={s.cardBody}>
          {current ? (
            <IdeaDetailsPanel row={current} allJudges={allJudges} />
          ) : (
            <div className={s.muted}>{t("admin.assignments.selectLeft")}</div>
          )}
        </div>
      </div>
    </div>
  );
}


