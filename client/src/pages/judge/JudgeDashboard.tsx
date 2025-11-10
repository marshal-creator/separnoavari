import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Tag,
  Typography,
  message,
  Slider,
  Spin,
} from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, FilePdfOutlined } from "@ant-design/icons";
import api from "../../service/api";
import { buildFileUrl } from "../../utils/download";
import FileViewerModal from "../../components/judges/FileViewerModal";

type JudgeProject = {
  id: number;
  judge_id: number;
  description: string;
  pdf_path: string | null;
  pdf_url: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  decision_at?: string | null;
  final_score?: number | null;
  evaluation?: {
    ratings?: number[];
  } | null;
};

export default function JudgeDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<JudgeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [viewerFileUrl, setViewerFileUrl] = useState<string | null>(null);
  const [viewerFileName, setViewerFileName] = useState<string>("");
  const [viewerOpen, setViewerOpen] = useState(false);
  
  const QUESTIONS = useMemo(() => [
    t("admin.judge.dashboard.questions.q1"),
    t("admin.judge.dashboard.questions.q2"),
    t("admin.judge.dashboard.questions.q3"),
    t("admin.judge.dashboard.questions.q4"),
    t("admin.judge.dashboard.questions.q5"),
    t("admin.judge.dashboard.questions.q6"),
    t("admin.judge.dashboard.questions.q7"),
    t("admin.judge.dashboard.questions.q8"),
    t("admin.judge.dashboard.questions.q9"),
    t("admin.judge.dashboard.questions.q10"),
  ], [t]);
  
  const [ratings, setRatings] = useState<number[]>(() => Array(10).fill(5));
  const [submitting, setSubmitting] = useState(false);
  
  const statusStyle: Record<string, { label: string; color: string }> = useMemo(() => ({
    APPROVED: { label: t("admin.judge.dashboard.status.approved"), color: "green" },
    ACCEPTED: { label: t("admin.judge.dashboard.status.accepted"), color: "green" },
    REJECTED: { label: t("admin.judge.dashboard.status.rejected"), color: "red" },
    PENDING: { label: t("admin.judge.dashboard.status.pending"), color: "blue" },
  }), [t]);

  async function load() {
    setLoading(true);
    try {
      const me = await api.get("/judge/me");
      if (!me.data?.judge) {
        navigate("/panel/judge/login");
        return;
      }
      const res = await api.get<JudgeProject[]>("/judge/projects");
      setProjects(res.data || []);
    } catch (e: any) {
      message.error(e?.response?.data?.error || t("admin.judge.dashboard.failedLoadProjects"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openEvaluation(project: JudgeProject) {
    setActiveProjectId(project.id);
    const existing = project.evaluation?.ratings;
    if (existing && existing.length === QUESTIONS.length) {
      setRatings(existing.map((value) => Number(value) || 5));
    } else {
      setRatings(Array(QUESTIONS.length).fill(5));
    }
  }

  async function submitEvaluation(projectId: number, decision: "APPROVED" | "REJECTED") {
    setSubmitting(true);
    try {
      await api.post(`/judge/projects/${projectId}/decision`, {
        decision,
        ratings,
      });
      message.success(decision === "APPROVED" ? t("admin.judge.dashboard.projectApproved") : t("admin.judge.dashboard.projectRejected"));
      setActiveProjectId(null);
      await load();
    } catch (e: any) {
      message.error(e?.response?.data?.error || t("admin.judge.dashboard.failedSubmitEvaluation"));
    } finally {
      setSubmitting(false);
    }
  }

  const totalScore = useMemo(
    () => ratings.reduce((sum, value) => sum + Number(value || 0), 0),
    [ratings]
  );

  const stats = useMemo(() => {
    const total = projects.length;
    const pending = projects.filter((p) => String(p.status || "PENDING").toUpperCase() === "PENDING").length;
    const approved = projects.filter((p) => ["APPROVED", "ACCEPTED"].includes(String(p.status || "").toUpperCase())).length;
    const rejected = projects.filter((p) => String(p.status || "").toUpperCase() === "REJECTED").length;
    return { total, pending, approved, rejected };
  }, [projects]);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 24 }}>
        {projects.length > 0 && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ textAlign: "center", borderRadius: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: 4 }}>
                  {t("admin.judge.dashboard.stats.total") || "Total Projects"}
                </Typography.Text>
                <Typography.Title level={3} style={{ margin: 0, color: "#1890ff" }}>
                  {stats.total}
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ textAlign: "center", borderRadius: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: 4 }}>
                  {t("admin.judge.dashboard.stats.pending") || "Pending"}
                </Typography.Text>
                <Typography.Title level={3} style={{ margin: 0, color: "#faad14" }}>
                  {stats.pending}
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ textAlign: "center", borderRadius: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: 4 }}>
                  {t("admin.judge.dashboard.stats.approved") || "Approved"}
                </Typography.Text>
                <Typography.Title level={3} style={{ margin: 0, color: "#52c41a" }}>
                  {stats.approved}
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ textAlign: "center", borderRadius: 12 }}>
                <Typography.Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: 4 }}>
                  {t("admin.judge.dashboard.stats.rejected") || "Rejected"}
                </Typography.Text>
                <Typography.Title level={3} style={{ margin: 0, color: "#ff4d4f" }}>
                  {stats.rejected}
                </Typography.Title>
              </Card>
            </Col>
          </Row>
        )}

        <div>
          <Typography.Title level={3} style={{ marginBottom: 8 }}>
            {t("admin.judge.dashboard.projectsList") || "Assigned Projects"}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("admin.judge.dashboard.subtitle")}
          </Typography.Text>
        </div>

        {projects.length === 0 ? (
          <Card style={{ borderRadius: 20, boxShadow: "0 16px 48px -24px rgba(15, 23, 42, 0.4)" }}>
            <Empty description={t("admin.judge.dashboard.noProjectsAssigned")} />
          </Card>
        ) : (
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            {projects.map((project) => {
              const statusKey = String(project.status || "PENDING").toUpperCase();
              const status = statusStyle[statusKey] ?? { label: t("admin.judge.dashboard.status.pending"), color: "blue" };
              const isPending = statusKey === "PENDING";
              const isActive = activeProjectId === project.id;
              const fileName = project.pdf_path ? (project.pdf_path.split("/").pop() || "project.pdf") : "project.pdf";

              return (
                <Card
                  key={project.id}
                  style={{
                    borderRadius: 20,
                    boxShadow: "0 16px 48px -26px rgba(15, 23, 42, 0.38)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  bodyStyle={{ display: "grid", gap: 16 }}
                  hoverable
                >
                  <Row gutter={[16, 16]} align="middle">
                    <Col flex="auto">
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                          <Typography.Title level={4} style={{ margin: 0 }}>
                            {t("admin.judge.dashboard.project")} #{project.id}
                          </Typography.Title>
                          <Tag color={status.color}>{status.label}</Tag>
                        </Space>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>
                          {project.description}
                        </Typography.Paragraph>
                        <Space size={12} wrap>
                          {typeof project.final_score === "number" && (
                            <Tag color="blue">{t("admin.judge.dashboard.finalScore")}: {project.final_score} / 100</Tag>
                          )}
                          {project.created_at && (
                            <Typography.Text type="secondary">
                              {t("admin.judge.dashboard.received")} {new Date(project.created_at).toLocaleString()}
                            </Typography.Text>
                          )}
                        </Space>
                      </Space>
                    </Col>
                  </Row>

                  <Space size={12} wrap>
                    {project.pdf_url && (
                      <Button
                        icon={<FilePdfOutlined />}
                        onClick={() => {
                          if (!project.pdf_url) return;
                          setViewerFileUrl(project.pdf_url);
                          setViewerFileName(fileName);
                          setViewerOpen(true);
                        }}
                        title={t("admin.judge.dashboard.openFile") || "View File"}
                      >
                        {fileName}
                      </Button>
                    )}
                    {project.evaluation?.ratings && project.evaluation.ratings.length === QUESTIONS.length && (
                      <Tag color="purple">
                        {t("admin.judge.dashboard.averageScore")}: {(project.evaluation.ratings.reduce((sum, val) => sum + val, 0) / QUESTIONS.length).toFixed(1)}
                      </Tag>
                    )}
                  </Space>

                  {isPending && (
                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
                      {isActive ? (
                        <Space direction="vertical" size={16} style={{ width: "100%" }}>
                          {QUESTIONS.map((question, idx) => (
                            <div key={question}
                              style={{
                                padding: 12,
                                borderRadius: 14,
                                background: "rgba(241, 245, 249, 0.65)",
                                border: "1px solid rgba(226, 232, 240, 0.6)",
                              }}
                            >
                              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                                <Typography.Text strong>{idx + 1}. {question}</Typography.Text>
                                <Slider
                                  min={1}
                                  max={10}
                                  value={ratings[idx]}
                                  onChange={(value) => {
                                    const next = [...ratings];
                                    next[idx] = Number(value);
                                    setRatings(next);
                                  }}
                                  marks={{ 1: "1", 10: "10" }}
                                />
                              </Space>
                            </div>
                          ))}

                          <Space align="center" style={{ justifyContent: "space-between" }}>
                            <Typography.Text strong>{t("admin.judge.dashboard.totalScore")}: {totalScore} / 100</Typography.Text>
                            <Space>
                              <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                loading={submitting}
                                onClick={() => submitEvaluation(project.id, "APPROVED")}
                              >
                                {t("admin.judge.dashboard.approve")}
                              </Button>
                              <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                loading={submitting}
                                onClick={() => submitEvaluation(project.id, "REJECTED")}
                              >
                                {t("admin.judge.dashboard.reject")}
                              </Button>
                              <Button onClick={() => setActiveProjectId(null)} disabled={submitting}>
                                {t("admin.judge.dashboard.cancel")}
                              </Button>
                            </Space>
                          </Space>
                        </Space>
                      ) : (
                        <Button type="primary" onClick={() => openEvaluation(project)}>
                          {t("admin.judge.dashboard.evaluateProject")}
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </Space>
        )}
      </div>

      <FileViewerModal
        open={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setViewerFileUrl(null);
          setViewerFileName("");
        }}
        fileUrl={viewerFileUrl}
        fileName={viewerFileName}
      />
    </div>
  );
}



