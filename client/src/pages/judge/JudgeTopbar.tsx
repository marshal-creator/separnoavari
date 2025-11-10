import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Typography, Space, Avatar, Button, message } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import api from "../../service/api";
import { useNavigate } from "react-router-dom";
import s from "../../styles/panel.module.scss";

type JudgeInfo = {
  id: number;
  name: string;
  username: string;
};

export default function JudgeTopbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [judge, setJudge] = useState<JudgeInfo | null>(null);

  useEffect(() => {
    loadJudgeInfo();
  }, []);

  const loadJudgeInfo = async () => {
    try {
      const res = await api.get("/judge/me");
      if (res.data?.judge) {
        setJudge(res.data.judge);
      }
    } catch (error) {
      console.error("Failed to load judge info:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/judge/logout");
      message.success("Logged out successfully");
      navigate("/panel/judge/login", { replace: true });
    } catch (error: any) {
      console.error("Logout error:", error);
      // Navigate anyway even if API call fails
      navigate("/panel/judge/login", { replace: true });
    }
  };

  return (
    <div className={s.topbar} style={{ justifyContent: "space-between", padding: "12px 24px", alignItems: "center" }}>
      <Typography.Title level={4} style={{ margin: 0, fontWeight: 600 }}>
        {t("admin.judge.dashboard.title") || "Judge Panel"}
      </Typography.Title>
      <Space size="large" align="center">
        {judge && (
          <Space size="small" style={{ cursor: "default" }}>
            <Avatar icon={<UserOutlined />} size="default" style={{ backgroundColor: "#1890ff" }} />
            <Space direction="vertical" size={0} style={{ lineHeight: 1.2 }}>
              <Typography.Text strong style={{ fontSize: "14px", display: "block" }}>
                {judge.name || judge.username}
              </Typography.Text>
              {judge.username && judge.username !== judge.name && (
                <Typography.Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                  @{judge.username}
                </Typography.Text>
              )}
            </Space>
          </Space>
        )}
        <Button 
          type="default" 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
          danger
        >
          {t("common.logout")}
        </Button>
      </Space>
    </div>
  );
}

