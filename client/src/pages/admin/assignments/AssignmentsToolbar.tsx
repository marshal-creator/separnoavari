import { useTranslation } from "react-i18next";
import s from "../../../styles/panel.module.scss";
import { useAutoAssign } from "../../../api/assignmentsHooks";

type Props = {
  status: "ALL" | "UNASSIGNED" | "ASSIGNED" | "REVIEWED";
  onStatusChange: (s: Props["status"]) => void;
  judges: { id: string; name: string }[];
  judgeFilter: string[];
  onJudgeFilterChange: (ids: string[]) => void;
  q: string; onQChange: (v: string) => void;
  view: "table" | "split";
  onToggleView: () => void;
};

export function AssignmentsToolbar(props: Props) {
  const { t } = useTranslation();
  const autoAssign = useAutoAssign();
  return (
    <div className={s.card}>
      <div className={s.cardBody}>
        <div className={s.filters}>
          <select className={s.select} value={props.status} onChange={e=>props.onStatusChange(e.target.value as any)}>
            <option value="ALL">{t("admin.assignments.filters.status.all")}</option>
            <option value="UNASSIGNED">{t("admin.assignments.filters.status.unassigned")}</option>
            <option value="ASSIGNED">{t("admin.assignments.filters.status.assigned")}</option>
            <option value="REVIEWED">{t("admin.assignments.filters.status.reviewed")}</option>
          </select>

          <select className={s.selectMulti} multiple value={props.judgeFilter} onChange={e=>{
            const vals = Array.from(e.currentTarget.selectedOptions).map(o=>o.value);
            props.onJudgeFilterChange(vals);
          }}>
            {props.judges.map(j=> <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>

          <input className={s.input} placeholder={t("admin.assignments.filters.searchPh")} value={props.q} onChange={e=>props.onQChange(e.target.value)} />

          <button className={s.btn} disabled={autoAssign.isPending} onClick={()=>autoAssign.mutate()} title={t("admin.assignments.buttons.autoAssign")}>
            {autoAssign.isPending ? "…" : t("admin.assignments.buttons.autoAssign")}
          </button>
          <button className={s.btn} title={t("admin.assignments.buttons.export")}>{t("admin.assignments.buttons.export")}</button>
          <button className={s.btn} onClick={props.onToggleView} title={t("admin.assignments.buttons.toggleView")}>
            {props.view === 'table' ? t("admin.assignments.buttons.splitView") : t("admin.assignments.buttons.tableView")}
          </button>
        </div>
      </div>
    </div>
  );
}


