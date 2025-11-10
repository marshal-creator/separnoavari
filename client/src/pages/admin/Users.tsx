import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getUserProfile,
  listUsers,
  updateUserRole,
  updateUserStatus,
} from "../../api";
import type { AdminUser } from "../../api";
import s from "../../styles/panel.module.scss";

type RoleFilter = "ALL" | "admin" | "judge" | "user";
type ModalState =
  | null
  | { type: "role" | "status" | "profile"; user: AdminUser };

const USER_ROLES = ["admin", "judge", "user"] as const;

export default function Users() {
  const { t } = useTranslation();
  const [data, setData] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    listUsers()
      .then(setData)
      .catch(() => setData([]));
  }, []);

  const rows = useMemo(() => {
    let d = [...(data || [])];
    if (role !== "ALL") d = d.filter((u) => u.role === role);
    if (q.trim()) {
      const qq = q.toLowerCase();
      d = d.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(qq) ||
          (u.email || "").toLowerCase().includes(qq)
      );
    }
    return d;
  }, [data, q, role]);

  const roleLabels: Record<AdminUser["role"], string> = {
    admin: t("admin.users.roles.admin"),
    judge: t("admin.users.roles.judge"),
    user: t("admin.users.roles.user"),
  };

  const statusLabels: Record<NonNullable<AdminUser["status"]>, string> = {
    ACTIVE: t("admin.users.status.active"),
    SUSPENDED: t("admin.users.status.suspended"),
  };

  const confirmChangeRole = async (
    user: AdminUser,
    newRole: (typeof USER_ROLES)[number]
  ) => {
    setLoadingId(user.id);
    try {
      await updateUserRole(user.id, newRole);
      setData((prev) =>
        (prev || []).map((u) =>
          u.id === user.id ? { ...u, role: newRole } : u
        )
      );
      setModal(null);
    } finally {
      setLoadingId(null);
    }
  };

  const confirmToggleStatus = async (user: AdminUser) => {
    const newStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    setLoadingId(user.id);
    try {
      await updateUserStatus(user.id, newStatus);
      setData((prev) =>
        (prev || []).map((u) =>
          u.id === user.id ? { ...u, status: newStatus } : u
        )
      );
      setModal(null);
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    if (modal?.type === "profile") {
      setProfile(null);
      getUserProfile(modal.user.id)
        .then(setProfile)
        .catch(() => setProfile({ error: true }));
    }
  }, [modal?.type, modal?.user?.id]);

  const roleOptions = [
    { value: "ALL", label: t("admin.users.filters.roles.all") },
    { value: "admin", label: t("admin.users.filters.roles.admin") },
    { value: "judge", label: t("admin.users.filters.roles.judge") },
    { value: "user", label: t("admin.users.filters.roles.user") },
  ];

  return (
    <div className={s.stack}>
      <h1>{t("admin.users.title")}</h1>

      <div className={s.card}>
        <div className={s.cardBody}>
          <div className={s.filters}>
            <input
              className={s.input}
              placeholder={t("admin.users.filters.searchPh")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {/* <select
              className={s.select}
              value={role}
              onChange={(e) => setRole(e.target.value as RoleFilter)}
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select> */}
          </div>
        </div>
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>{t("admin.users.table.headers.name")}</th>
              <th>{t("admin.users.table.headers.email")}</th>
              {/* <th>{t("admin.users.table.headers.role")}</th> */}
              {/* <th>{t("admin.users.table.headers.lastLogin")}</th> */}
              <th>{t("admin.users.table.headers.ideas")}</th>
              {/* <th>{t("admin.users.table.headers.status")}</th> */}
              {/* <th>{t("admin.users.table.headers.actions")}</th> */}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const toggleTitle =
                u.status === "SUSPENDED"
                  ? t("admin.users.actions.unsuspendTitle")
                  : t("admin.users.actions.suspendTitle");
              const toggleLabel =
                u.status === "SUSPENDED"
                  ? t("admin.users.actions.unsuspend")
                  : t("admin.users.actions.suspend");
              return (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  {/* <td>{roleLabels[u.role]}</td> */}
                  {/* <td>
                    {u.lastLogin
                      ? new Date(u.lastLogin).toLocaleString()
                      : t("admin.users.table.noLogin")}
                  </td> */}
                  <td>{u.ideasSubmitted ?? 0}</td>
                  {/* <td>{statusLabels[u.status]}</td> */}
                  {/* <td style={{ display: "flex", gap: 6 }}>
                    <button
                      className={s.btn}
                      title={t("admin.users.actions.editRole")}
                      onClick={() => setModal({ type: "role", user: u })}
                    >
                      {t("admin.users.actions.editRole")}
                    </button>
                    <button
                      className={s.btn}
                      title={toggleTitle}
                      onClick={() => setModal({ type: "status", user: u })}
                    >
                      {toggleLabel}
                    </button>
                    <button
                      className={s.btn}
                      title={t("admin.users.actions.viewProfile")}
                      onClick={() => setModal({ type: "profile", user: u })}
                    >
                      {t("admin.users.actions.viewProfile")}
                    </button>
                  </td> */}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className={s.muted}>
                  {t("admin.users.table.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
          }}
          onClick={() => setModal(null)}
        >
          <div
            className={s.card}
            style={{ width: "min(720px, 94vw)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={s.cardBody}>
              {modal.type === "role" && (
                <div className={s.stack}>
                  <h3>{t("admin.users.modalRole.title")}</h3>
                  <div>
                    {t("admin.users.modalRole.description", {
                      name: modal.user.name,
                      email: modal.user.email,
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {USER_ROLES.map((r) => (
                      <button
                        key={r}
                        disabled={loadingId === modal.user.id}
                        className={s.btn}
                        onClick={() => confirmChangeRole(modal.user, r)}
                      >
                        {roleLabels[r]}
                      </button>
                    ))}
                  </div>
                  <div>
                    <button className={s.btnGhost} onClick={() => setModal(null)}>
                      {t("admin.users.common.close")}
                    </button>
                  </div>
                </div>
              )}

              {modal.type === "status" && (
                <div className={s.stack}>
                  <h3>
                    {modal.user.status === "SUSPENDED"
                      ? t("admin.users.modalStatus.title.unsuspend")
                      : t("admin.users.modalStatus.title.suspend")}
                  </h3>
                  <div>
                    {modal.user.status === "SUSPENDED"
                      ? t("admin.users.modalStatus.description.unsuspend", {
                          name: modal.user.name,
                        })
                      : t("admin.users.modalStatus.description.suspend", {
                          name: modal.user.name,
                        })}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className={s.btnPrimary}
                      disabled={loadingId === modal.user.id}
                      onClick={() => confirmToggleStatus(modal.user)}
                    >
                      {t("admin.users.common.confirm")}
                    </button>
                    <button className={s.btnGhost} onClick={() => setModal(null)}>
                      {t("admin.users.common.cancel")}
                    </button>
                  </div>
                </div>
              )}

              {modal.type === "profile" && (
                <div className={s.stack}>
                  <h3>{t("admin.users.modalProfile.title")}</h3>
                  {!profile && (
                    <div className={s.muted}>
                      {t("admin.users.modalProfile.loading")}
                    </div>
                  )}
                  {profile?.error && (
                    <div className={s.muted}>
                      {t("admin.users.modalProfile.error")}
                    </div>
                  )}
                  {profile && !profile.error && (
                    <div className={s.stack}>
                      <div>
                        <strong>{t("admin.users.modalProfile.fields.name")}:</strong>{" "}
                        {profile.name}
                      </div>
                      <div>
                        <strong>{t("admin.users.modalProfile.fields.email")}:</strong>{" "}
                        {profile.email}
                      </div>
                      <div>
                        <strong>{t("admin.users.modalProfile.fields.role")}:</strong>{" "}
                        {roleLabels[profile.role as AdminUser["role"]] ??
                          profile.role}
                      </div>
                      <div>
                        <strong>{t("admin.users.modalProfile.fields.status")}:</strong>{" "}
                        {(profile.status && statusLabels[profile.status]) ??
                          profile.status}
                      </div>
                      <div style={{ marginTop: 8, fontWeight: 700 }}>
                        {t("admin.users.modalProfile.recentIdeas")}
                      </div>
                      <div className={s.stack}>
                        {profile.recentIdeas?.map((ri: any) => (
                          <div
                            key={ri.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <div>{ri.title}</div>
                            <div className={s.muted}>
                              {new Date(ri.submittedAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                        {(!profile.recentIdeas ||
                          profile.recentIdeas.length === 0) && (
                          <div className={s.muted}>
                            {t("admin.users.modalProfile.noIdeas")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <button className={s.btnGhost} onClick={() => setModal(null)}>
                      {t("admin.users.common.close")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}
