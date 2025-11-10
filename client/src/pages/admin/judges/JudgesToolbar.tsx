import { useState } from "react";
import { useTranslation } from "react-i18next";
import s from "../../../styles/panel.module.scss";
import { useInviteJudge } from "../../../api/judgesHooks";

type Props = {
  expertise: string[]; onExpertiseChange: (tags: string[])=>void;
  status: "ALL"|"ACTIVE"|"INACTIVE"|"SUSPENDED"; onStatusChange: (s: Props["status"])=>void;
  capacityState: "ALL"|"HAS"|"FULL"|"OVER"; onCapacityStateChange: (s: Props["capacityState"])=>void;
  q: string; onQChange: (v: string)=>void;
};

export function JudgesToolbar(p: Props) {
  const { t } = useTranslation();
  const invite = useInviteJudge();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  return (
    <div className={s.card}>
      <div className={s.cardBody}>
        <div className={s.filters}>
          <select className={s.select} value={p.status} onChange={e=>p.onStatusChange(e.target.value as any)}>
            <option value="ALL">{t("admin.judges.filters.status.all")}</option>
            <option value="ACTIVE">{t("admin.judges.filters.status.active")}</option>
            <option value="INACTIVE">{t("admin.judges.filters.status.inactive")}</option>
            <option value="SUSPENDED">{t("admin.judges.filters.status.suspended")}</option>
          </select>
          <select className={s.select} value={p.capacityState} onChange={e=>p.onCapacityStateChange(e.target.value as any)}>
            <option value="ALL">{t("admin.judges.filters.capacity.all")}</option>
            <option value="HAS">{t("admin.judges.filters.capacity.has")}</option>
            <option value="FULL">{t("admin.judges.filters.capacity.full")}</option>
            <option value="OVER">{t("admin.judges.filters.capacity.over")}</option>
          </select>
          <input className={s.input} placeholder={t("admin.judges.filters.searchPh")} value={p.q} onChange={e=>p.onQChange(e.target.value)} />

          <input className={s.input} placeholder={t("admin.judges.invite.namePh")} value={name} onChange={e=>setName(e.target.value)} />
          <input className={s.input} placeholder={t("admin.judges.invite.emailPh")} value={email} onChange={e=>setEmail(e.target.value)} />
          <button className={s.btn} disabled={invite.isPending} onClick={()=>invite.mutate({ name, email })}>
            {t("admin.judges.buttons.invite")}
          </button>
          <button className={s.btn}>{t("admin.judges.buttons.export")}</button>
        </div>
      </div>
    </div>
  );
}


