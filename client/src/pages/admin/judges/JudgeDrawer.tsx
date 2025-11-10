import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import s from "../../../styles/panel.module.scss";
import { useJudgePerformance } from "../../../api/judgesHooks";

type JudgePerformance = {
  reviewsDone?: number;
  avgScore?: number;
  turnaround?: string;
  reviewsPerWeek?: Array<{ label: string; value: number }>;
  scoreDistribution?: number[];
};

export function JudgeDrawer({ id, onClose }:{ id: string | null; onClose: ()=>void }){
  const { t } = useTranslation();
  const perf = useJudgePerformance(id || undefined) as { data?: JudgePerformance; isLoading: boolean };
  useEffect(()=>{
    // nothing
  }, [id]);
  if (!id) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 60 }} onClick={onClose}>
      <div className={s.card} style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 'min(520px, 96vw)', overflow: 'auto' }} onClick={e=>e.stopPropagation()}>
        <div className={s.cardBody}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{t('admin.judges.drawer.title')}</h3>
            <button className={s.btnGhost} onClick={onClose}>✕</button>
          </div>
          {!perf.data && perf.isLoading && <div className={s.muted}>{t('admin.judges.loading')}</div>}
          {perf.data && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                <StatCard label={t('admin.judges.metrics.reviewsDone')} value={String(perf.data.reviewsDone||0)} />
                <StatCard label={t('admin.judges.metrics.avgScore')} value={String(perf.data.avgScore ?? '—')} />
                <StatCard label={t('admin.judges.metrics.turnaround')} value={String(perf.data.turnaround ?? '—')} />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('admin.judges.metrics.reviewsPerWeek')}</div>
                <MiniBar data={perf.data.reviewsPerWeek || []} />
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('admin.judges.metrics.scoreDistribution')}</div>
                <MiniBar data={(perf.data.scoreDistribution||[]).map((v:number, i:number)=>({ label: String(i+1), value: v }))} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }:{ label: string; value: string }){
  return (
    <div style={{ border: '1px solid var(--panel-border)', borderRadius: 12, padding: 12 }}>
      <div style={{ color: 'var(--panel-muted)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function MiniBar({ data }:{ data: { label: string; value: number }[] }){
  const max = Math.max(1, ...data.map(d=>d.value));
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'end' }}>
      {data.map(d=> (
        <div key={d.label} title={`${d.label}: ${d.value}`} style={{ width: 16, height: 4 + (d.value/max)*64, background: 'var(--primary)', borderRadius: 4 }} />
      ))}
    </div>
  );
}


