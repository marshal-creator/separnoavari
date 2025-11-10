import { useTranslation } from "react-i18next";
import s from "../../../styles/panel.module.scss";
import type { UiAssignment } from "./AssignmentsPage";

export function IdeaDetailsPanel({ row, allJudges }: { row: UiAssignment; allJudges: { id: string; name: string }[] }) {
  const { t } = useTranslation();
  return (
    <div className={s.stack}>
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{row.ideaTitle}</div>
        <div className={s.muted}>{row.category || '—'} • {row.submitter || '—'}</div>
      </div>

      <div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{t("admin.assignments.judgesAssigned")}</div>
        {row.judges.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {row.judges.map(j => (
              <span key={j.id} className={s.btn}>{j.name}</span>
            ))}
          </div>
        ) : (
          <div className={s.muted}>{t("admin.assignments.unassigned")}</div>
        )}
      </div>

      <div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{t("admin.assignments.brief.title")}</div>
        {row.brief?.pdfUrl ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                const url = row.brief?.pdfUrl?.startsWith('http') 
                  ? row.brief.pdfUrl 
                  : `${window.location.origin}${row.brief.pdfUrl}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              {t("admin.assignments.brief.viewPdf")}
            </a>
            <button className={s.btn}>{t("admin.assignments.buttons.replace")}</button>
            <button className={s.btn}>{t("admin.assignments.brief.remove")}</button>
          </div>
        ) : (
          <button className={s.btn}>{t("admin.assignments.brief.upload")}</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className={s.btn} title={t("admin.assignments.buttons.assign")}>🧩 {t("admin.assignments.buttons.assign")}</button>
        <button className={s.btn} title={t("admin.assignments.buttons.unassign")}>🗑 {t("admin.assignments.buttons.unassign")}</button>
        <button className={s.btn} title={t("admin.assignments.buttons.openReview")}>📄 {t("admin.assignments.buttons.openReview")}</button>
      </div>
    </div>
  );
}


