import { LogoutOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Invalid credentials");
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
    navigate("/panel/admin/login");
  };

  return (
    <Tooltip title={t("common.logout")} placement="right">
      <Button
        type="text"
        icon={<LogoutOutlined />}
        onClick={handleLogout}
        className={className}
        aria-label={t("common.logout")}
      >
        {t("common.logout")}
      </Button>
    </Tooltip>
  );
}
