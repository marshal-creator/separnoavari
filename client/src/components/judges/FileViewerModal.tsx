import { useEffect, useState } from "react";
import { Modal, Button, Typography, Space, Spin, Alert } from "antd";
import { DownloadOutlined, FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { buildFileUrl } from "../../utils/download";

const { Text } = Typography;

type FileViewerModalProps = {
  open: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName?: string;
};

export default function FileViewerModal({ open, onClose, fileUrl, fileName }: FileViewerModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "word" | "unknown">("unknown");

  useEffect(() => {
    if (!open || !fileUrl) {
      setError(null);
      setLoading(false);
      return;
    }

    // Determine file type from URL or filename
    const nameToCheck = fileName || fileUrl.toLowerCase();
    if (nameToCheck.endsWith(".pdf")) {
      setFileType("pdf");
    } else if (nameToCheck.endsWith(".doc") || nameToCheck.endsWith(".docx")) {
      setFileType("word");
    } else {
      setFileType("unknown");
    }

    setError(null);
    setLoading(false);
  }, [open, fileUrl, fileName]);

  const handleDownload = () => {
    if (!fileUrl) return;
    const url = buildFileUrl(fileUrl);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const displayFileName = fileName || (fileUrl ? fileUrl.split("/").pop() || "file" : "file");
  const displayUrl = fileUrl ? buildFileUrl(fileUrl) : null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} onClick={handleDownload}>
          {t("admin.fileViewer.download") || "Download"}
        </Button>,
        <Button key="close" onClick={onClose}>
          {t("common.close") || "Close"}
        </Button>,
      ]}
      width="90%"
      style={{ top: 20 }}
      bodyStyle={{ padding: 0, minHeight: "70vh" }}
      title={
        <Space>
          {fileType === "pdf" && <FilePdfOutlined />}
          {fileType === "word" && <FileWordOutlined />}
          <Text strong>{displayFileName}</Text>
        </Space>
      }
      destroyOnClose
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <div style={{ padding: 24 }}>
          <Alert
            message={t("common.error") || "Error"}
            description={error}
            type="error"
            showIcon
          />
        </div>
      ) : !displayUrl ? (
        <div style={{ padding: 24 }}>
          <Alert
            message={t("admin.fileViewer.noFile") || "No file available"}
            type="warning"
            showIcon
          />
        </div>
      ) : fileType === "pdf" ? (
        <div style={{ width: "100%", height: "70vh" }}>
          <iframe
            src={displayUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            title={displayFileName}
          />
        </div>
      ) : fileType === "word" ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <FileWordOutlined style={{ fontSize: 64, color: "#1890ff", marginBottom: 16 }} />
          <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
            {t("admin.fileViewer.wordPreview") || "Word documents cannot be previewed inline. Please download to view."}
          </Text>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            onClick={handleDownload}
          >
            {t("admin.fileViewer.download") || "Download File"}
          </Button>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Text type="secondary">
            {t("admin.fileViewer.unknownType") || "File type not supported for preview."}
          </Text>
          <br />
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            style={{ marginTop: 16 }}
            onClick={handleDownload}
          >
            {t("admin.fileViewer.download") || "Download File"}
          </Button>
        </div>
      )}
    </Modal>
  );
}

