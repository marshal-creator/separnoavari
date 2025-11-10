import { useTranslation } from "react-i18next";
import s from "../../../styles/panel.module.scss";
import type { UiAssignment } from "./AssignmentsPage";

type Props = {
  rows: UiAssignment[];
  allJudges: { id: string; name: string }[];
};

export function AssignmentsTable({ rows }: Props) {
  const { t } = useTranslation();
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>{t("admin.assignments.columns.title")}</th>
            <th>{t("admin.assignments.columns.category")}</th>
            <th>{t("admin.assignments.columns.submitter")}</th>
            <th>{t("admin.assignments.columns.judges")}</th>
            <th>{t("admin.assignments.columns.brief")}</th>
            <th>{t("admin.assignments.columns.created")}</th>
            <th>{t("admin.assignments.columns.status")}</th>
            <th>{t("admin.assignments.columns.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.ideaTitle}</td>
              <td>{r.category || '—'}</td>
              <td>{r.submitter || '—'}</td>
              <td>{r.judges.length ? r.judges.map(j=>j.name).join(', ') : t("admin.assignments.unassigned")}</td>
              <td>
                {r.brief?.pdfUrl ? (
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      const url = r.brief?.pdfUrl?.startsWith('http') 
                        ? r.brief.pdfUrl 
                        : `${window.location.origin}${r.brief.pdfUrl}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    {t("admin.assignments.brief.viewPdf")}
                  </a>
                ) : (
                  t("admin.assignments.brief.upload")
                )}
              </td>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
              <td>{r.status}</td>
              <td style={{ display: 'flex', gap: 6 }}>
                <button className={s.btn} title={t("admin.assignments.buttons.assign")} aria-label="Assign">🧩</button>
                <button className={s.btn} title={t("admin.assignments.buttons.upload")} aria-label="Upload">📤</button>
                <button className={s.btn} title={t("admin.assignments.buttons.unassign")} aria-label="Unassign">🗑</button>
                <button className={s.btn} title={t("admin.assignments.buttons.openIdea")} aria-label="Open Idea">📄</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className={s.muted}>{t("admin.assignments.empty")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


