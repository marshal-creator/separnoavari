import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Drawer,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { FileOutlined } from "@ant-design/icons";
import api from "../../../service/api";

type ProjectRow = {
  id: number;
  judgeId: number;
  judgeName: string;
  judgeUsername: string;
  description: string;
  status: string;
  final_score: number | null;
  pdf_url: string | null;
  created_at?: string;
  evaluation?: {
    ratings?: number[];
  } | null;
};

const QUESTIONS = [
  "How scientifically valuable is the project?",
  "How innovative or creative is the idea?",
  "How practical is the solution?",
  "How clear is the explanation?",
  "How well-structured is the report?",
  "How strong is the technical implementation?",
  "How impactful is the research?",
  "How original is the approach?",
  "How relevant is it to the topic or problem domain?",
  "Overall project quality.",
];

const statusLabels: Record<string, { label: string; color: string }> = {
  APPROVED: { label: "Approved", color: "green" },
  ACCEPTED: { label: "Approved", color: "green" },
  REJECTED: { label: "Rejected", color: "red" },
  PENDING: { label: "Pending", color: "blue" },
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [judgeFilter, setJudgeFilter] = useState<number | undefined>(undefined);
  const [searchValue, setSearchValue] = useState("");
  const [drawerProject, setDrawerProject] = useState<ProjectRow | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const res = await api.get<ProjectRow[]>("/admin/projects");
      setProjects(res.data ?? []);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  const judgeOptions = useMemo(() => {
    const unique = new Map<number, { value: number; label: string }>();
    projects.forEach((project) => {
      if (project.judgeId && !unique.has(project.judgeId)) {
        unique.set(project.judgeId, {
          value: project.judgeId,
          label: project.judgeName
            ? `${project.judgeName} (${project.judgeUsername})`
            : project.judgeUsername,
        });
      }
    });
    return Array.from(unique.values());
  }, [projects]);

  const filtered = useMemo(() => {
    return projects
      .filter((item) => {
        if (!statusFilter) return true;
        return String(item.status || "").toUpperCase() === statusFilter;
      })
      .filter((item) => {
        if (!judgeFilter) return true;
        return item.judgeId === judgeFilter;
      })
      .filter((item) => {
        if (!searchValue.trim()) return true;
        const q = searchValue.toLowerCase();
        return (
          item.description?.toLowerCase().includes(q) ||
          item.judgeName?.toLowerCase().includes(q) ||
          item.judgeUsername?.toLowerCase().includes(q)
        );
      });
  }, [projects, statusFilter, judgeFilter, searchValue]);

  const columns: ColumnsType<ProjectRow> = useMemo(
    () => [
      {
        title: "Project",
        dataIndex: "description",
        key: "description",
        render: (value: string) => (
          <Typography.Paragraph ellipsis={{ rows: 2, tooltip: value }} style={{ marginBottom: 0 }}>
            {value}
          </Typography.Paragraph>
        ),
      },
      {
        title: "Judge",
        dataIndex: "judgeName",
        key: "judge",
        render: (value: string, record) => value ? `${value} (${record.judgeUsername})` : record.judgeUsername,
        responsive: ["md"],
        width: 220,
      },
      {
        title: "Score",
        dataIndex: "final_score",
        key: "score",
        width: 140,
        sorter: (a, b) => (a.final_score ?? 0) - (b.final_score ?? 0),
        render: (score: number | null) => (
          <Badge
            count={typeof score === "number" ? `${score} / 100` : "—"}
            style={{ backgroundColor: typeof score === "number" ? "#1677ff" : undefined }}
          />
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 140,
        filters: [
          { text: "Pending", value: "PENDING" },
          { text: "Approved", value: "APPROVED" },
          { text: "Rejected", value: "REJECTED" },
        ],
        onFilter: (value, record) => String(record.status || "").toUpperCase() === value,
        render: (status: string) => {
          const key = String(status || "PENDING").toUpperCase();
          const info = statusLabels[key] ?? { label: status || "Pending", color: "blue" };
          return <Tag color={info.color}>{info.label}</Tag>;
        },
      },
      {
        title: "Actions",
        key: "actions",
        width: 180,
        render: (_, record) => (
          <Space>
            {record.pdf_url && (
              <Button 
                type="link" 
                icon={<FileOutlined />}
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
            <Button type="link" onClick={() => setDrawerProject(record)}>
              Feedback
            </Button>
          </Space>
        ),
      },
    ],
    []
  );

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Typography.Title level={2} style={{ marginBottom: 0 }}>
        Projects Overview
      </Typography.Title>

      <Card
        style={{ borderRadius: 18, boxShadow: "0 16px 44px -22px rgba(15, 23, 42, 0.35)" }}
        bodyStyle={{ display: "grid", gap: 16 }}
      >
        <Space wrap>
          <Select
            placeholder="Filter by status"
            style={{ minWidth: 180 }}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Pending", value: "PENDING" },
              { label: "Approved", value: "APPROVED" },
              { label: "Rejected", value: "REJECTED" },
            ]}
          />
          <Select
            placeholder="Filter by judge"
            style={{ minWidth: 220 }}
            allowClear
            value={judgeFilter}
            onChange={setJudgeFilter}
            options={judgeOptions}
          />
          <Input.Search
            placeholder="Search projects"
            allowClear
            style={{ minWidth: 240 }}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </Space>

        <Table<ProjectRow>
          dataSource={filtered}
          columns={columns}
          loading={loading}
          rowKey={(row) => row.id}
          pagination={{ pageSize: 12, showSizeChanger: false }}
          scroll={{ x: true }}
        />
      </Card>

      <Drawer
        width={420}
        title={drawerProject ? `Feedback • Project #${drawerProject.id}` : "Judge Feedback"}
        open={Boolean(drawerProject)}
        onClose={() => setDrawerProject(null)}
      >
        {drawerProject?.evaluation?.ratings && drawerProject.evaluation.ratings.length === QUESTIONS.length ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {drawerProject.evaluation.ratings.map((rating, index) => (
              <Card key={index} size="small" style={{ borderRadius: 12 }}>
                <Typography.Text strong>
                  {index + 1}. {QUESTIONS[index]}
                </Typography.Text>
                <div style={{ marginTop: 6 }}>
                  <Tag color="blue">{rating} / 10</Tag>
                </div>
              </Card>
            ))}
            <Typography.Paragraph>
              Total Score: <Typography.Text strong>{drawerProject.final_score ?? "—"} / 100</Typography.Text>
            </Typography.Paragraph>
          </Space>
        ) : (
          <Typography.Text type="secondary">
            No feedback is available for this project yet.
          </Typography.Text>
        )}
      </Drawer>
    </Space>
  );
}


