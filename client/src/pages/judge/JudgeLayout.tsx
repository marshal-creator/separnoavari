import { Outlet } from "react-router-dom";
import JudgeTopbar from "./JudgeTopbar";
import s from "../../styles/panel.module.scss";

export default function JudgeLayout() {
  return (
    <div 
      className={s.layout} 
      data-panel="judge" 
      style={{ 
        gridTemplateColumns: "1fr",
        minHeight: "100vh",
        display: "grid",
      }}
    >
      <div className={s.main} style={{ display: "grid", gridTemplateRows: "auto 1fr" }}>
        <JudgeTopbar />
        <div className={s.content} style={{ overflow: "auto" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

