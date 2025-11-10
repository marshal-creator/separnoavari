import { useState } from "react";
import { useTranslation } from "react-i18next";
import s from "../../../styles/panel.module.scss";

export type UiJudge = {
  id: string;
  name: string;
  email?: string;
  expertise?: string[];
  capacity: number | null;
  assigned: number;
  assignedCount: number;
  load: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  lastLogin?: string | null;
};

type Props = {
  loading?: boolean;
  rows: UiJudge[];
  onEditCapacity: (id: string, capacity: number | null) => void;
  onToggleStatus: (id: string, next: UiJudge["status"]) => void;
  onOpenDrawer: (id: string) => void;
};

export function JudgesTable({ loading, rows, onEditCapacity, onToggleStatus, onOpenDrawer }: Props) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [capValue, setCapValue] = useState<string>("");

  function startEdit(j: UiJudge) {
    setEditingId(j.id);
    setCapValue(j.capacity == null ? "" : String(j.capacity));
  }
  function commitEdit(id: string) {
    const v = capValue.trim();
    const parsed = v === "" ? null : Number(v);
    if (v !== "" && (!Number.isFinite(parsed!) || parsed! < 0)) return;
    onEditCapacity(id, parsed);
    setEditingId(null);
  }
  function colorForLoad(assigned: number, capacity: number | null) {
    if (capacity == null) return '#10b981';
    const ratio = assigned / Math.max(1, capacity);
    if (ratio < 0.8) return '#10b981';
    if (ratio < 1) return '#f59e0b';
    return '#ef4444';
  }

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>{t("admin.judges.columns.name")}</th>
            <th>{t("admin.judges.columns.email")}</th>
            <th>{t("admin.judges.columns.expertise")}</th>
            <th>{t("admin.judges.columns.capacity")}</th>
            <th>{t("admin.judges.columns.assigned")}</th>
            <th>{t("admin.judges.columns.load")}</th>
            <th>{t("admin.judges.columns.status")}</th>
            <th>{t("admin.judges.columns.lastLogin")}</th>
            <th>{t("admin.judges.columns.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(j => (
            <tr key={j.id}>
              <td>{j.name}</td>
              <td>{j.email || '—'}</td>
              <td>{(j.expertise||[]).length ? (j.expertise||[]).join(', ') : '—'}</td>
              <td>
                {editingId === j.id ? (
                  <input
                    className={s.input}
                    style={{ width: 96 }}
                    placeholder={t("admin.judges.unlimited")}
                    value={capValue}
                    onChange={e=>setCapValue(e.target.value)}
                    onBlur={()=>commitEdit(j.id)}
                    onKeyDown={e=>{ if (e.key==='Enter') commitEdit(j.id); if (e.key==='Escape') setEditingId(null); }}
                    autoFocus
                  />
                ) : (
                  <button className={s.btn} title={t("admin.judges.editCapacity")} onClick={()=>startEdit(j)}>
                    {j.capacity == null ? t("admin.judges.unlimited") : j.capacity}
                  </button>
                )}
              </td>
              <td>{j.assignedCount}</td>
              <td>
                <div title={`${j.assignedCount} / ${j.capacity ?? '∞'}`} style={{ width: 120, height: 8, background: '#1f2937', borderRadius: 999 }}>
                  <div style={{ width: j.capacity == null ? '40%' : `${Math.min(100, (j.assignedCount/Math.max(1, j.capacity))*100)}%`, height: '100%', background: colorForLoad(j.assignedCount, j.capacity), borderRadius: 999 }} />
                </div>
              </td>
              <td>{j.status}</td>
              <td>{j.lastLogin ? new Date(j.lastLogin).toLocaleString() : '—'}</td>
              <td style={{ display: 'flex', gap: 6 }}>
                <button className={s.btn} title={t("admin.judges.actions.viewPerf")} onClick={()=>onOpenDrawer(j.id)}>📊</button>
                {j.status !== 'SUSPENDED' ? (
                  <button className={s.btn} title={t("admin.judges.actions.suspend")} onClick={()=>onToggleStatus(j.id, 'SUSPENDED')}>⏸</button>
                ) : (
                  <button className={s.btn} title={t("admin.judges.actions.activate")} onClick={()=>onToggleStatus(j.id, 'ACTIVE')}>▶</button>
                )}
              </td>
            </tr>
          ))}
          {rows.length===0 && (
            <tr><td colSpan={9} className={s.muted}>{loading ? t('admin.judges.loading') : t('admin.judges.empty')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


