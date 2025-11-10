import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Typography, Input, Button, Space, Alert } from "antd";
import { UserOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import api from "../../service/api";

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("admin/login", { username, password }, { withCredentials: true });
      const from = (location.state as any)?.from?.pathname || "/panel/admin";
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || t("admin.adminLogin.loginFailed"));
    } finally {
      setLoading(false);
    }
  }

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
              {t("admin.adminLogin.title")}
            </Typography.Title>
            <Typography.Text type="secondary">
              {t("admin.adminLogin.subtitle")}
            </Typography.Text>
          </div>

          <form onSubmit={onSubmit}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <div>
                <Typography.Text strong>{t("admin.adminLogin.username")}</Typography.Text>
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder={t("admin.adminLogin.usernamePlaceholder")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div>
                <Typography.Text strong>{t("admin.adminLogin.password")}</Typography.Text>
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder={t("admin.adminLogin.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              {error && <Alert type="error" message={error} showIcon />}

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                icon={<LoginOutlined />}
                loading={loading}
              >
                {t("admin.adminLogin.login")}
              </Button>
            </Space>
          </form>
        </Space>
      </Card>
    </div>
  );
}


