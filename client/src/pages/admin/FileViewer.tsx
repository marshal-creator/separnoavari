import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button, Typography, Space, Spin, Alert, Card } from "antd";
import { ArrowLeftOutlined, DownloadOutlined, FilePdfOutlined, FileWordOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

const ADMIN_FILE_ROUTE_PREFIX = import.meta.env.VITE_ADMIN_FILE_ROUTE_PREFIX || "/api/admin/files";

export default function FileViewer() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileType, setFileType] = useState<"pdf" | "word" | "unknown">("unknown");

  const owner = searchParams.get("owner");
  const name = searchParams.get("name");

  useEffect(() => {
    if (!owner || !name) {
      setError("Missing owner or filename parameters");
      setLoading(false);
      return;
    }

    // Build secure file URL
    // Both owner and name come from URL query params (React Router auto-decodes them)
    // We need to encode them ONCE for the HTTP request
    // Files are stored with real UTF-8 Persian characters on disk
    
    // Normalize owner - should be a plain email address
    const encodedOwner = encodeURIComponent(owner);
    
    // Normalize filename - handle mixed encoding edge cases
    // React Router's useSearchParams().get() returns decoded values
    // But if the original URL had mixed encoding, we might get a partially decoded string
    let nameToEncode = name;
    
    // Check for mixed encoding (both % encoded parts and decoded Persian chars)
    // This happens when React Router partially decodes query params
    if (name.includes('%') && /[\u0600-\u06FF\u200C\u200D]/.test(name)) {
      // Mixed encoding detected - need to fully decode then re-encode
      try {
        // First, try to decode the entire string (handles cases where it's fully encoded)
        // If that fails or doesn't change it, try manual decoding of % sequences
        let decoded = name;
        try {
          decoded = decodeURIComponent(name);
        } catch {
          // If full decode fails, manually decode % sequences
          decoded = name.replace(/%([0-9A-F]{2})/gi, (match, hex) => {
            try {
              return decodeURIComponent(match);
            } catch {
              return match;
            }
          });
        }
        nameToEncode = decoded;
      } catch (e) {
        // If all decoding fails, use as-is (might already be fully decoded)
        console.warn('Could not normalize mixed encoding, using as-is:', name);
        nameToEncode = name;
      }
    }
    
    // Encode ONCE for the HTTP request
    // This ensures the filename is properly URL-encoded for the server
    const encodedName = encodeURIComponent(nameToEncode);
    
    // Get API base from env (could be empty, "/api", or full URL like "http://localhost:5000")
    const envApiBase = import.meta.env.VITE_API_BASE || "";
    
    // Normalize: if empty or "/api", use same-origin (Vite proxy handles /api/*)
    // Otherwise use the full base URL
    let url: string;
    if (!envApiBase || envApiBase === "/api") {
      // Same-origin: Vite proxy forwards /api/* to server
      // ADMIN_FILE_ROUTE_PREFIX should be "/api/admin/files"
      url = `${ADMIN_FILE_ROUTE_PREFIX}/${encodedOwner}/${encodedName}`;
    } else {
      // Absolute URL case (production or custom config)
      // Remove trailing slash from base, ensure prefix starts with /
      const base = envApiBase.endsWith("/") ? envApiBase.slice(0, -1) : envApiBase;
      const prefix = ADMIN_FILE_ROUTE_PREFIX.startsWith("/") 
        ? ADMIN_FILE_ROUTE_PREFIX 
        : `/${ADMIN_FILE_ROUTE_PREFIX}`;
      url = `${base}${prefix}/${encodedOwner}/${encodedName}`;
    }
    
    setFileUrl(url);
    setFileName(name);

    // Determine file type
    const lowerName = name.toLowerCase();
    if (lowerName.endsWith(".pdf")) {
      setFileType("pdf");
    } else if (lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) {
      setFileType("word");
    } else {
      setFileType("unknown");
    }

    setLoading(false);
  }, [owner, name]);

  const handleDownload = () => {
    if (!fileUrl) return;
    const downloadUrl = fileUrl + (fileUrl.includes("?") ? "&" : "?") + "download=1";
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            {t("common.back") || "Back"}
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {fileName}
          </Title>
        </Space>

        <Card>
          {fileType === "pdf" ? (
            <div style={{ width: "100%", height: "80vh" }}>
              <iframe
                src={fileUrl || ""}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                title={fileName}
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
        </Card>

        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            {t("admin.fileViewer.download") || "Download"}
          </Button>
        </Space>
      </Space>
    </div>
  );
}

