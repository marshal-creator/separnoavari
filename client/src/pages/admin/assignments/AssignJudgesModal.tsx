import s from "../../../styles/panel.module.scss";

export function AssignJudgesModal({ open, onClose, onConfirm, judges, selected }:{
  open: boolean; onClose: ()=>void; onConfirm: (ids: string[])=>void;
  judges: { id: string; name: string; assignedCount?: number; capacity?: number }[];
  selected: string[];
}){
  if (!open) return null;
  let color = (ratio:number)=> ratio < 0.8 ? '#10b981' : (ratio < 1 ? '#f59e0b' : '#ef4444');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'grid', placeItems: 'center', zIndex: 60 }} onClick={onClose}>
      <div className={s.card} style={{ width: 'min(720px, 94vw)' }} onClick={e=>e.stopPropagation()}>
        <div className={s.cardBody}>
          <h3>Assign to Judges</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {judges.map(j => {
              const assigned = j.assignedCount ?? 0; const cap = j.capacity ?? 10; const ratio = assigned/cap;
              return (
                <label key={j.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" defaultChecked={selected.includes(j.id)} onChange={(e)=>{
                    const ids = new Set(selected);
                    if (e.currentTarget.checked) ids.add(j.id); else ids.delete(j.id);
                    onConfirm(Array.from(ids));
                  }} />
                  <div>{j.name}</div>
                  <div title={`${assigned} / ${cap}`} style={{ width: 120, height: 8, background: '#1f2937', borderRadius: 999 }}>
                    <div style={{ width: `${Math.min(100, (ratio*100))}%`, height: '100%', background: color(ratio), borderRadius: 999 }} />
                  </div>
                </label>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className={s.btnPrimary} onClick={onClose}>Done</button>
            <button className={s.btnGhost} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}


