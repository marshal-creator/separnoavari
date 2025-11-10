import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge,
  Button,
  Card,
  Input,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { FilePdfOutlined, TrophyOutlined } from "@ant-design/icons";
import api from "../../../service/api";

type ProjectRow = {
  id: number;
  judgeId: number;
  judgeName: string | null;
  judgeUsername: string | null;
  description: string;
  status: string;
  final_score: number | null;
  pdf_url: string | null;
  created_at?: string;
  decision_at?: string | null;
  evaluation?: {
    ratings?: number[];
  } | null;
  rank?: number;
};

function formatStatus(status: string | null | undefined, t: (key: string) => string) {
  const upper = String(status || "").toUpperCase();
  if (upper === "APPROVED" || upper === "ACCEPTED") return t("admin.status.accepted");
  if (upper === "REJECTED") return t("admin.status.rejected");
  if (upper === "PENDING") return t("admin.status.pending");
  return status || "—";
}

export default function ProjectsRankingPage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await api.get<ProjectRow[]>("/admin/projects");
      // Sort by final_score descending, then by id
      const sorted = (res.data ?? []).sort((a, b) => {
        const scoreA = a.final_score ?? 0;
        const scoreB = b.final_score ?? 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return b.id - a.id;
      });
      setProjects(sorted);
    } catch (error: any) {
      message.error(error?.response?.data?.error || t("admin.ranking.failedLoadProjects") || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  // Add rank to each project based on its position in the sorted list
  const projectsWithRank = useMemo(() => {
    return projects.map((project, index) => ({
      ...project,
      rank: index + 1,
    }));
  }, [projects]);

  const filtered = useMemo(() => {
    if (!searchValue.trim()) return projectsWithRank;
    const q = searchValue.toLowerCase();
    return projectsWithRank.filter(
      (item) =>
        item.description?.toLowerCase().includes(q) ||
        item.judgeName?.toLowerCase().includes(q) ||
        item.judgeUsername?.toLowerCase().includes(q) ||
        item.id.toString().includes(q)
    );
  }, [projectsWithRank, searchValue]);

  const getRankBadge = (rank: number | undefined) => {
    if (rank === 1) return { emoji: "🥇", color: "#FFD700", bg: "#FFF8DC" };
    if (rank === 2) return { emoji: "🥈", color: "#C0C0C0", bg: "#F5F5F5" };
    if (rank === 3) return { emoji: "🥉", color: "#CD7F32", bg: "#FAEBD7" };
    return null;
  };

  const columns: ColumnsType<ProjectRow> = useMemo(
    () => [
      {
        title: t("admin.ranking.columns.rank"),
        key: "rank",
        width: 80,
        render: (_, record) => {
          const rank = record.rank ?? 0;
          const badge = getRankBadge(rank);
          if (badge) {
            return (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: badge.bg,
                  border: `2px solid ${badge.color}`,
                  fontSize: 24,
                }}
              >
                {badge.emoji}
              </div>
            );
          }
          return (
            <Typography.Text strong style={{ fontSize: 16, color: "#6b7280" }}>
              #{rank}
            </Typography.Text>
          );
        },
      },
      {
        title: t("admin.ranking.columns.title"),
        dataIndex: "description",
        key: "description",
        render: (value: string, record) => {
          const rank = record.rank ?? 0;
          const badge = getRankBadge(rank);
          return (
            <Typography.Paragraph
              ellipsis={{ rows: 2, tooltip: value }}
              style={{
                marginBottom: 0,
                fontWeight: badge ? 600 : 400,
                color: badge ? badge.color : undefined,
              }}
            >
              {value || t("admin.ranking.untitled")}
            </Typography.Paragraph>
          );
        },
      },
      {
        title: t("admin.ranking.columns.judge"),
        key: "judge",
        width: 220,
        render: (_, record) => {
          if (record.judgeName) {
            return (
              <Typography.Text>
                {record.judgeName} {record.judgeUsername && `(${record.judgeUsername})`}
              </Typography.Text>
            );
          }
          return record.judgeUsername ? (
            <Typography.Text>{record.judgeUsername}</Typography.Text>
          ) : (
            <Typography.Text type="secondary">—</Typography.Text>
          );
        },
        responsive: ["md"],
      },
      {
        title: t("admin.ranking.columns.score"),
        dataIndex: "final_score",
        key: "score",
        width: 140,
        sorter: (a, b) => (a.final_score ?? 0) - (b.final_score ?? 0),
        defaultSortOrder: "descend",
        render: (score: number | null, record) => {
          const rank = record.rank ?? 0;
          const badge = getRankBadge(rank);
          if (typeof score === "number") {
            return (
              <Badge
                count={`${score} / 100`}
                style={{
                  backgroundColor: badge?.color || "#1677ff",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              />
            );
          }
          return <Typography.Text type="secondary">—</Typography.Text>;
        },
      },
      {
        title: t("admin.ranking.columns.status"),
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status: string) => {
          const upper = String(status || "").toUpperCase();
          let color = "blue";
          if (upper === "APPROVED" || upper === "ACCEPTED") color = "green";
          if (upper === "REJECTED") color = "red";
          return <Tag color={color}>{formatStatus(status, t)}</Tag>;
        },
      },
      {
        title: t("admin.ranking.columns.date"),
        key: "date",
        width: 180,
        render: (_, record) => {
          const date = record.decision_at || record.created_at;
          if (date) {
            return (
              <Typography.Text type="secondary">
                {new Date(date).toLocaleDateString()}
              </Typography.Text>
            );
          }
          return <Typography.Text type="secondary">—</Typography.Text>;
        },
        responsive: ["lg"],
      },
      {
        title: t("admin.ranking.columns.actions"),
        key: "actions",
        width: 120,
        render: (_, record) => (
          <Space>
            {record.pdf_url && (
              <Button
                type="link"
                icon={<FilePdfOutlined />}
                title={t("admin.ranking.downloadPdf")}
                onClick={async () => {
                  if (!record.pdf_url) return;
                  const filename = record.pdf_url.split('/').pop() || `project-${record.id}.pdf`;
                  const { downloadFile } = await import("../../../utils/download");
                  await downloadFile(record.pdf_url, filename, 'application/pdf');
                }}
              >
                PDF
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [t]
  );

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 12 }}>
            <TrophyOutlined style={{ color: "#FFD700" }} />
            {t("admin.ranking.title")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("admin.ranking.subtitle")}
          </Typography.Text>
        </div>
      </div>

      <Card
        style={{ borderRadius: 18, boxShadow: "0 16px 44px -22px rgba(15, 23, 42, 0.35)" }}
        bodyStyle={{ display: "grid", gap: 16 }}
      >
        <Input.Search
          placeholder={t("admin.ranking.searchPlaceholder")}
          allowClear
          style={{ maxWidth: 400 }}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          size="large"
        />

        <Table<ProjectRow>
          dataSource={filtered}
          columns={columns}
          loading={loading}
          rowKey={(row) => row.id}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} ${t("admin.ranking.of", { defaultValue: "of" })} ${total} ${t("admin.ranking.projects", { defaultValue: "projects" })}`,
            pageSizeOptions: ["10", "15", "25", "50", "100"],
          }}
          scroll={{ x: true }}
          rowClassName={(record) => {
            const rank = record.rank ?? 0;
            const badge = getRankBadge(rank);
            if (badge) {
              return "ranking-top-row";
            }
            return "";
          }}
        />
      </Card>

      <style>{`
        .ranking-top-row {
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.05) 0%, transparent 100%);
        }
        .ranking-top-row:hover {
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%) !important;
        }
      `}</style>
    </Space>
  );
}

