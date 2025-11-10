import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Card, Form, Input, Space, Typography, message } from "antd";
import { UserAddOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import api from "../../../service/api";

type FormValues = {
  name: string;
  username: string;
  password: string;
};

export default function JudgeCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      await api.post("/admin/judges", values);
      message.success(t("admin.judges.pages.judgeCreatePage.createdSuccess"));
      navigate("/panel/admin/judges");
    } catch (error: any) {
      message.error(error?.response?.data?.error || t("admin.judges.pages.judgeCreatePage.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            {t("admin.judges.pages.judgeCreatePage.title")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("admin.judges.pages.judgeCreatePage.subtitle")}
          </Typography.Text>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {t("admin.judges.pages.judgeCreatePage.back")}
        </Button>
      </div>

      <Card
        style={{ maxWidth: 520, borderRadius: 18, boxShadow: "0 12px 40px -18px rgba(15, 23, 42, 0.35)" }}
      >
        <Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
          <Form.Item
            label={t("admin.judges.pages.judgeCreatePage.fullName")}
            name="name"
            rules={[{ required: true, message: t("admin.judges.pages.judgeCreatePage.fullNameRequired") }]}
          >
            <Input size="large" placeholder={t("admin.judges.pages.judgeCreatePage.fullNamePlaceholder")} allowClear autoFocus />
          </Form.Item>

          <Form.Item
            label={t("admin.judges.pages.judgeCreatePage.username")}
            name="username"
            rules={[{ required: true, message: t("admin.judges.pages.judgeCreatePage.usernameRequired") }]}
          >
            <Input size="large" placeholder={t("admin.judges.pages.judgeCreatePage.usernamePlaceholder")} allowClear autoComplete="username" />
          </Form.Item>

          <Form.Item
            label={t("admin.judges.pages.judgeCreatePage.password")}
            name="password"
            rules={[{ required: true, message: t("admin.judges.pages.judgeCreatePage.passwordRequired") }]}
          >
            <Input.Password
              size="large"
              placeholder={t("admin.judges.pages.judgeCreatePage.passwordPlaceholder")}
              allowClear
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              icon={<UserAddOutlined />}
            >
              {t("admin.judges.pages.judgeCreatePage.createJudge")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}


