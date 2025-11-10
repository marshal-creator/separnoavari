import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { InboxOutlined, ArrowLeftOutlined, CloudUploadOutlined } from "@ant-design/icons";
import api from "../../../service/api";

type AdminJudge = {
  id: number;
  name: string;
  username: string;
};

type JudgeProject = {
  id: number;
  description: string;
  status: string;
  final_score: number | null;
  pdf_path: string | null;
  pdf_url: string | null;
  created_at?: string;
};

const statusColors: Record<string, string> = {
  APPROVED: "green",
  ACCEPTED: "green",
  REJECTED: "red",
  PENDING: "blue",
};

function formatStatus(status: string | null | undefined, t: (key: string) => string) {
  const upper = String(status || "").toUpperCase();
  if (upper === "APPROVED" || upper === "ACCEPTED") return t("admin.status.accepted");
  if (upper === "REJECTED") return t("admin.status.rejected");
  if (upper === "PENDING") return t("admin.status.pending");
  return status || "—";
}

export default function JudgeAssignPage() {
  const { t } = useTranslation();
  const { judgeId: judgeIdParam } = useParams();
  const navigate = useNavigate();
  const [judges, setJudges] = useState<AdminJudge[]>([]);
  const [selectedJudgeId, setSelectedJudgeId] = useState<number | null>(null);
  const [projects, setProjects] = useState<JudgeProject[]>([]);
  const [loadingJudges, setLoadingJudges] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm<{ description: string }>();

  useEffect(() => {
    loadJudges();
  }, []);

  useEffect(() => {
    if (selectedJudgeId != null) {
      loadProjects(selectedJudgeId);
    }
  }, [selectedJudgeId]);

  async function loadJudges() {
    setLoadingJudges(true);
    try {
      const res = await api.get<AdminJudge[]>("/admin/judges");
      const list = res.data ?? [];
      setJudges(list);
      if (list.length) {
        const fallback = Number(judgeIdParam);
        const initial = list.find((j) => j.id === fallback) ?? list[0];
        setSelectedJudgeId(initial.id);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.error || t("admin.judges.pages.judgeAssignPage.failedLoadJudges"));
    } finally {
      setLoadingJudges(false);
    }
  }

  async function loadProjects(judgeId: number) {
    setLoadingProjects(true);
    try {
      const res = await api.get<JudgeProject[]>(`/admin/judges/${judgeId}/projects`);
      setProjects(res.data ?? []);
    } catch (error: any) {
      message.error(error?.response?.data?.error || t("admin.judges.pages.judgeAssignPage.failedLoadProjects"));
    } finally {
      setLoadingProjects(false);
    }
  }

  const selectedJudge = useMemo(
    () => judges.find((j) => j.id === selectedJudgeId) ?? null,
    [judges, selectedJudgeId]
  );

  const uploadProps = {
    multiple: false,
    maxCount: 1,
    accept: ".pdf",
    fileList,
    beforeUpload: (file: UploadFile) => {
      if (file.type !== "application/pdf") {
        message.error(t("admin.judges.pages.judgeAssignPage.onlyPdfAllowed"));
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  const handleSubmit = async (values: { description: string }) => {
    if (!selectedJudgeId) {
      message.error(t("admin.judges.pages.judgeAssignPage.selectJudgeFirst"));
      return;
    }console.log(fileList);
    if (!fileList.length || !fileList[0]) {
      message.error(t("admin.judges.pages.judgeAssignPage.uploadPdfRequired"));
      return;
    }
    const fd = new FormData();
    fd.append("description", values.description);
    fd.append("pdf", fileList[0] as unknown as File);
    try {
      await api.post(`/admin/judges/${selectedJudgeId}/projects`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success(t("admin.judges.pages.judgeAssignPage.projectAssigned"));
      form.resetFields();
      setFileList([]);
      loadProjects(selectedJudgeId);
    } catch (error: any) {
      message.error(error?.response?.data?.error || t("admin.judges.pages.judgeAssignPage.assignFailed"));
    }
  };

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            {t("admin.judges.pages.judgeAssignPage.title")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("admin.judges.pages.judgeAssignPage.subtitle")}
          </Typography.Text>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t("admin.judges.pages.judgeAssignPage.back")}
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={10}>
          <Card
            title={t("admin.judges.pages.judgeAssignPage.projectDetails")}
            loading={loadingJudges}
            style={{ borderRadius: 18, boxShadow: "0 14px 38px -18px rgba(15, 23, 42, 0.35)" }}
          >
            <Form
              layout="vertical"
              form={form}
              onFinish={handleSubmit}
              requiredMark={false}
            >
              <Form.Item label={t("admin.judges.pages.judgeAssignPage.selectJudge")} required>
                <Select
                  size="large"
                  placeholder={t("admin.judges.pages.judgeAssignPage.chooseJudge")}
                  value={selectedJudgeId ?? undefined}
                  onChange={(value) => setSelectedJudgeId(value)}
                  options={judges.map((judge) => ({
                    value: judge.id,
                    label: `${judge.name} (${judge.username})`,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label={t("admin.judges.pages.judgeAssignPage.projectTitleDescription")}
                name="description"
                rules={[{ required: true, message: t("admin.judges.pages.judgeAssignPage.describeProject") }]}
              >
                <Input.TextArea
                  rows={4}
                  maxLength={1000}
                  showCount
                  placeholder={t("admin.judges.pages.judgeAssignPage.projectDescriptionPlaceholder")}
                  style={{ borderRadius: 12 }}
                />
              </Form.Item>

              <Form.Item label={t("admin.judges.pages.judgeAssignPage.projectPdf")} required>
                <Upload.Dragger {...uploadProps}
                  style={{ borderRadius: 16 }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">{t("admin.judges.pages.judgeAssignPage.dropPdf")}</p>
                  <p className="ant-upload-hint">{t("admin.judges.pages.judgeAssignPage.pdfHint")}</p>
                </Upload.Dragger>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  icon={<CloudUploadOutlined />}
                  disabled={!selectedJudgeId}
                >
                  {t("admin.judges.pages.judgeAssignPage.assignProject")}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card
            title={selectedJudge ? `${selectedJudge.name}'s ${t("admin.judges.pages.judgeAssignPage.queue")}` : t("admin.judges.pages.judgeAssignPage.assignedProjects")}
            loading={loadingProjects}
            style={{ borderRadius: 18, boxShadow: "0 14px 38px -18px rgba(15, 23, 42, 0.35)" }}
          >
            {projects.length === 0 ? (
              <Empty description={t("admin.judges.pages.judgeAssignPage.noProjectsYet")} />
            ) : (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {projects.map((project) => {
                  const status = String(project.status || "PENDING").toUpperCase();
                  const color = statusColors[status] || "blue";
                  const fileName = project.pdf_path ? project.pdf_path.split("/").pop() : "project.pdf";
                  return (
                    <Card
                      key={project.id}
                      size="small"
                      style={{ borderRadius: 14, boxShadow: "0 12px 32px -18px rgba(15, 23, 42, 0.3)" }}
                    >
                      <Space direction="vertical" size={10} style={{ width: "100%" }}>
                        <Space style={{ justifyContent: "space-between", width: "100%" }}>
                          <Typography.Text strong>{t("admin.judges.pages.judgeAssignPage.project")} #{project.id}</Typography.Text>
                          <Tag color={color}>{formatStatus(project.status, t)}</Tag>
                        </Space>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>
                          {project.description}
                        </Typography.Paragraph>
                        <Space wrap size={12}>
                          {typeof project.final_score === "number" && (
                            <Tag color="blue">{t("admin.judges.pages.judgeAssignPage.score")}: {project.final_score} / 100</Tag>
                          )}
                          {project.created_at && (
                            <Typography.Text type="secondary">
                              {t("admin.judges.pages.judgeAssignPage.uploaded")} {new Date(project.created_at).toLocaleString()}
                            </Typography.Text>
                          )}
                        </Space>
                        {project.pdf_url && (
                          <Button 
                            type="link"
                            onClick={() => {
                              const url = project.pdf_url?.startsWith('http') 
                                ? project.pdf_url 
                                : `${window.location.origin}${project.pdf_url}`;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            {fileName}
                          </Button>
                        )}
                      </Space>
                    </Card>
                  );
                })}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}


