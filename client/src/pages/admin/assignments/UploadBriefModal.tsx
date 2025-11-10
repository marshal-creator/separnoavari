import { useRef, useState } from "react";
import s from "../../../styles/panel.module.scss";

export function UploadBriefModal({ open, onClose, onUpload }:{ open: boolean; onClose: ()=>void; onUpload: (file: File)=>void; }){
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  if (!open) return null;
  const onFile = () => {
    const f = inputRef.current?.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') { setError('Only PDF allowed'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('Max 10MB'); return; }
    onUpload(f);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'grid', placeItems: 'center', zIndex: 60 }} onClick={onClose}>
      <div className={s.card} style={{ width: 'min(520px, 94vw)' }} onClick={e=>e.stopPropagation()}>
        <div className={s.cardBody}>
          <h3>Upload Brief (PDF)</h3>
          <input ref={inputRef} type="file" accept="application/pdf" />
          {error && <div className={s.muted} style={{ color: '#ef4444' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className={s.btnPrimary} onClick={onFile}>Upload</button>
            <button className={s.btnGhost} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}


