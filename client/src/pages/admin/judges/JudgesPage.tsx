import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../../service/api";
import s from "../../../styles/panel.module.scss";

type AdminJudge = {
  id: number;
  name: string;
  username: string;
  projectCount: number;
};

type JudgeProject = {
  id: number;
  description: string;
  status: string;
  final_score: number | null;
  pdf_url: string | null;
  created_at?: string;
  updated_at?: string;
  decision_at?: string;
};

type OverviewProject = {
  id: number;
  judgeId: number;
  judgeName: string;
  judgeUsername: string;
  description: string;
  status: string;
  final_score: number | null;
  pdf_url: string | null;
  created_at?: string;
};

function formatStatus(status: string | null | undefined, t: (key: string) => string) {
  const upper = String(status || "").toUpperCase();
  if (upper === "APPROVED" || upper === "ACCEPTED") return t("admin.status.accepted");
  if (upper === "REJECTED") return t("admin.status.rejected");
  if (upper === "PENDING") return t("admin.status.pending");
  return status || "—";
}

export default function JudgesPage() {
  const { t } = useTranslation();
  const [judges, setJudges] = useState<AdminJudge[]>([]);
  const [selectedJudgeId, setSelectedJudgeId] = useState<number | null>(null);
  const [judgeProjects, setJudgeProjects] = useState<JudgeProject[]>([]);
  const [overview, setOverview] = useState<OverviewProject[]>([]);
  const [loadingJudges, setLoadingJudges] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadJudges();
    loadOverview();
  }, []);

  useEffect(() => {
    if (selectedJudgeId != null) {
      loadJudgeProjects(selectedJudgeId);
    } else {
      setJudgeProjects([]);
    }
  }, [selectedJudgeId]);

  async function loadJudges() {
    setLoadingJudges(true);
    setMessage(null);
    try {
      const res = await api.get<AdminJudge[]>("/admin/judges");
      setJudges(res.data || []);
      if (res.data?.length && selectedJudgeId == null) {
        setSelectedJudgeId(res.data[0].id);
      }
    } catch (e: any) {
      setMessage(e?.response?.data?.error || t("admin.judges.pages.judgesPage.failedLoadJudges"));
    } finally {
      setLoadingJudges(false);
    }
  }

  async function loadJudgeProjects(judgeId: number) {
    setLoadingProjects(true);
    setMessage(null);
    try {
      const res = await api.get<JudgeProject[]>(`/admin/judges/${judgeId}/projects`);
      setJudgeProjects(res.data || []);
    } catch (e: any) {
      setMessage(e?.response?.data?.error || t("admin.judges.pages.judgesPage.failedLoadProjects"));
    } finally {
      setLoadingProjects(false);
    }
  }

  async function loadOverview() {
    setLoadingOverview(true);
    setMessage(null);
    try {
      const res = await api.get<OverviewProject[]>("/admin/projects");
      setOverview(res.data || []);
    } catch (e: any) {
      setMessage(e?.response?.data?.error || t("admin.judges.pages.judgesPage.failedLoadOverview"));
    } finally {
      setLoadingOverview(false);
    }
  }

  return (
    <div className={s.stack}>
      <h1>{t("admin.judges.pages.judgesPage.title")}</h1>
      {message && (
        <div
          style={{
            padding: "8px 12px",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: 6,
          }}
        >
          {message}
        </div>
      )}

      <div className={s.card}>
        <div className={s.cardBody}>
          <h2 style={{ marginTop: 0 }}>{t("admin.judges.pages.judgesPage.createJudge")}</h2>
          <CreateJudgeForm onCreated={() => { loadJudges(); }} />
          <div style={{ height: 16 }} />
          <h2 style={{ marginTop: 0 }}>{t("admin.judges.pages.judgesPage.assignProject")}</h2>
          <AssignProjectForm
            judges={judges}
            onAssigned={(judgeId) => {
              loadJudges();
              loadOverview();
              if (judgeId === selectedJudgeId) {
                loadJudgeProjects(judgeId);
              }
            }}
          />
        </div>
      </div>

      <div className={s.card}>
        <div className={s.cardBody}>
          <h2 style={{ marginTop: 0 }}>{t("admin.judges.pages.judgesPage.judgesList")}</h2>
          {loadingJudges ? (
            <div>{t("admin.judges.pages.judgesPage.loadingJudges")}</div>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>{t("admin.judges.pages.judgesPage.tableHeaders.name")}</th>
                    <th>{t("admin.judges.pages.judgesPage.tableHeaders.username")}</th>
                    <th>{t("admin.judges.pages.judgesPage.tableHeaders.assignedProjects")}</th>
                    <th>{t("admin.judges.pages.judgesPage.tableHeaders.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {judges.map((j) => (
                    <tr key={j.id}>
                      <td>{j.name}</td>
                      <td>{j.username}</td>
                      <td>{j.projectCount}</td>
                      <td>
                        <button
                          className={s.btn}
                          onClick={() => setSelectedJudgeId(j.id)}
                          style={{ padding: "4px 12px" }}
                        >
                          {t("admin.judges.pages.judgesPage.viewDetails")}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {judges.length === 0 && (
                    <tr>
                      <td colSpan={4} className={s.muted}>
                        {t("admin.judges.pages.judgesPage.noJudges")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedJudgeId != null && (
        <div className={s.card}>
          <div className={s.cardBody}>
            <h2 style={{ marginTop: 0 }}>{t("admin.judges.pages.judgesPage.judgeProjects")}</h2>
            {loadingProjects ? (
              <div>{t("admin.judges.pages.judgesPage.loadingProjects")}</div>
            ) : (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>{t("admin.judges.pages.judgesPage.tableHeaders.id")}</th>
                      <th>{t("admin.judges.pages.judgesPage.tableHeaders.description")}</th>
                      <th>{t("admin.judges.pages.judgesPage.tableHeaders.status")}</th>
                      <th>{t("admin.judges.pages.judgesPage.tableHeaders.score")}</th>
                      <th>{t("admin.judges.pages.judgesPage.tableHeaders.pdf")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {judgeProjects.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.description}</td>
                        <td>{formatStatus(p.status, t)}</td>
                        <td>{p.final_score ?? "—"}</td>
                        <td>
                          {p.pdf_url ? (
                            <a 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                const url = p.pdf_url?.startsWith('http') 
                                  ? p.pdf_url 
                                  : `${window.location.origin}${p.pdf_url}`;
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                            >
                              {t("admin.judges.pages.judgesPage.download")}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                    {judgeProjects.length === 0 && (
                      <tr>
                        <td colSpan={5} className={s.muted}>
                          {t("admin.judges.pages.judgesPage.noProjects")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={s.card}>
        <div className={s.cardBody}>
          <h2 style={{ marginTop: 0 }}>{t("admin.judges.pages.judgesPage.projectScoresOverview")}</h2>
          {loadingOverview ? (
            <div>{t("admin.judges.pages.judgesPage.loadingOverview")}</div>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>{t("admin.judges.pages.judgesPage.tableHeaders.projectId")}</th>
                    <th>{t("admin.judges.pages.judgesPage.tableHeaders.description")}</th>
                    <th>{t("admin.judges.pages.judgesPage.tableHeaders.judge")}</th>
                    <th>{t("admin.judges.pages.judgesPage.tableHeaders.status")}</th>
                    <th>{t("admin.judges.pages.judgesPage.tableHeaders.score")}</th>
                    <th>{t("admin.judges.pages.judgesPage.tableHeaders.pdf")}</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.description}</td>
                      <td>
                        {p.judgeName ? `${p.judgeName} (${p.judgeUsername})` : "—"}
                      </td>
                      <td>{formatStatus(p.status, t)}</td>
                      <td>{p.final_score ?? "—"}</td>
                      <td>
                        {p.pdf_url ? (
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              const url = p.pdf_url?.startsWith('http') 
                                ? p.pdf_url 
                                : `${window.location.origin}${p.pdf_url}`;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            {t("admin.judges.pages.judgesPage.download")}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                  {overview.length === 0 && (
                    <tr>
                      <td colSpan={6} className={s.muted}>
                        {t("admin.judges.pages.judgesPage.noProjects")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateJudgeForm({ onCreated }: { onCreated: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      await api.post("/admin/judges", { name, username, password });
      setStatus(t("admin.judges.pages.judgesPage.createForm.created"));
      setName("");
      setUsername("");
      setPassword("");
      onCreated();
    } catch (e: any) {
      setStatus(e?.response?.data?.error || t("admin.judges.pages.judgesPage.createForm.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <input
        className={s.input}
        placeholder={t("admin.judges.pages.judgesPage.createForm.namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={s.input}
        placeholder={t("admin.judges.pages.judgesPage.createForm.usernamePlaceholder")}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className={s.input}
        placeholder={t("admin.judges.pages.judgesPage.createForm.passwordPlaceholder")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className={s.btn} disabled={loading} type="submit">
        {t("admin.judges.pages.judgesPage.createForm.createButton")}
      </button>
      {status && <span style={{ alignSelf: "center" }}>{status}</span>}
    </form>
  );
}

function AssignProjectForm({
  judges,
  onAssigned,
}: {
  judges: AdminJudge[];
  onAssigned: (judgeId: number) => void;
}) {
  const { t } = useTranslation();
  const [judgeId, setJudgeId] = useState<number | null>(judges[0]?.id ?? null);
  const [description, setDescription] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (judges.length && judgeId == null) {
      setJudgeId(judges[0].id);
    }
  }, [judges]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!judgeId || !pdf) {
      setStatus(t("admin.judges.pages.judgesPage.assignForm.missingFields"));
      return;
    }
    setStatus(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("description", description);
      fd.append("pdf", pdf);
      await api.post(`/admin/judges/${judgeId}/projects`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus(t("admin.judges.pages.judgesPage.assignForm.assigned"));
      setDescription("");
      setPdf(null);
      onAssigned(judgeId);
    } catch (e: any) {
      setStatus(e?.response?.data?.error || t("admin.judges.pages.judgesPage.assignForm.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <select
        className={s.select}
        value={judgeId ?? ""}
        onChange={(e) => setJudgeId(Number(e.target.value))}
      >
        {judges.map((j) => (
          <option key={j.id} value={j.id}>
            {j.name} ({j.username})
          </option>
        ))}
      </select>
      <input
        className={s.input}
        placeholder={t("admin.judges.pages.judgesPage.assignForm.descriptionPlaceholder")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        className={s.input}
        type="file"
        accept="application/pdf"
        onChange={(e) => setPdf(e.target.files?.[0] || null)}
      />
      <button className={s.btn} disabled={loading} type="submit">
        {t("admin.judges.pages.judgesPage.assignForm.assignButton")}
      </button>
      {status && <span style={{ alignSelf: "center" }}>{status}</span>}
    </form>
  );
}

