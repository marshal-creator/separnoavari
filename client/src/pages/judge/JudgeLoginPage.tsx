import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Form, Input, Typography, Button, Space, message } from "antd";
import { LockOutlined, UserOutlined, LoginOutlined } from "@ant-design/icons";
import api from "../../service/api";

type FormValues = {
  username: string;
  password: string;
};

export default function JudgeLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      await api.post("/judge/login", values);
      message.success(t("admin.judge.login.welcomeBack"));
      navigate("/panel/judge");
    } catch (error: any) {
      message.error(error?.response?.data?.error || t("admin.judge.login.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
      }}
    >
      <Card
        style={{
          width: 380,
          borderRadius: 24,
          boxShadow: "0 24px 60px -30px rgba(15, 23, 42, 0.45)",
        }}
      >
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          <div>
            <Typography.Title level={3} style={{ marginBottom: 8 }}>
              {t("admin.judge.login.title")}
            </Typography.Title>
            <Typography.Text type="secondary">
              {t("admin.judge.login.subtitle")}
            </Typography.Text>
          </div>

          <Form layout="vertical" onFinish={handleFinish} requiredMark={false}>
            <Form.Item
              label={t("admin.judge.login.username")}
              name="username"
              rules={[{ required: true, message: t("admin.judge.login.usernameRequired") }]}
            >
              <Input
                size="large"
                prefix={<UserOutlined />}
                placeholder={t("admin.judge.login.usernamePlaceholder")}
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              label={t("admin.judge.login.password")}
              name="password"
              rules={[{ required: true, message: t("admin.judge.login.passwordRequired") }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder={t("admin.judge.login.passwordPlaceholder")}
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                icon={<LoginOutlined />}
                loading={loading}
              >
                {t("admin.judge.login.signIn")}
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}



