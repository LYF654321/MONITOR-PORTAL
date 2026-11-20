import type { ReactNode } from "react";
import { App, Button, Empty, Table, Tag, Typography, Tooltip } from "antd";
import type { TableProps } from "antd";
import { CopyOutlined, SafetyCertificateFilled } from "@ant-design/icons";
import type { SystemCode } from "@/types";
function PortalMark() {
  return (
    <svg
      className="portal-mark-svg"
      viewBox="0 0 48 48"
      role="img"
      aria-label="监测统一门户图标"
    >
      <defs>
        <linearGradient
          id="portal-mark-gradient"
          x1="9"
          y1="8"
          x2="39"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ff9b43" />
          <stop offset="1" stopColor="#e96518" />
        </linearGradient>
        <linearGradient
          id="portal-mark-core"
          x1="16"
          y1="16"
          x2="32"
          y2="33"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f9872c" />
          <stop offset="1" stopColor="#d95a14" />
        </linearGradient>
      </defs>
      <path
        d="M24 7.5 39.5 16v16L24 40.5 8.5 32V16L24 7.5Z"
        fill="none"
        stroke="url(#portal-mark-gradient)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.5"
      />
      <path
        d="M24 14.8 32.3 19.6v8.8L24 33.2l-8.3-4.8v-8.8l8.3-4.8Z"
        fill="url(#portal-mark-core)"
      />
      <path
        d="M14.2 21.8 19 24.6m14.8-2.8L29 24.6M24 36v-5.8"
        fill="none"
        stroke="#fff"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M21 27.2v-4.7l3-1.8 3 1.8v4.7l-3 1.8-3-1.8Z"
        fill="#fff"
      />
      <path
        d="M23.3 24.1h1.4v1.9h-1.4z"
        fill="#e56a1b"
      />
    </svg>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <PortalMark />
      </span>
      <div>
        <strong>{compact ? "监测门户" : "监测统一门户"}</strong>
        {!compact && <small>MONITORING PORTAL</small>}
      </div>
    </div>
  );
}
export function PageHeader({
  title,
  description,
  extra,
}: {
  title: string;
  description: string;
  extra?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {extra}
    </div>
  );
}
type DataTableProps<T extends object> = TableProps<T> & {
  fixedBody?: boolean;
};

export function DataTable<T extends object>({
  fixedBody = false,
  className,
  scroll,
  ...props
}: DataTableProps<T>) {
  return (
    <Table<T>
      rowKey="id"
      size="middle"
      className={[fixedBody ? "list-data-table" : "", className]
        .filter(Boolean)
        .join(" ")}
      scroll={{
        x: "max-content",
        ...(fixedBody ? { y: "100%" } : {}),
        ...scroll,
      }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无符合条件的数据"
          />
        ),
      }}
      {...props}
      pagination={
        props.pagination === false
          ? false
          : {
              defaultPageSize: 10,
              pageSizeOptions: [10, 20, 50, 100],
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              ...props.pagination,
            }
      }
    />
  );
}
export function SystemTag({
  code,
  disabled = false,
}: {
  code: SystemCode;
  disabled?: boolean;
}) {
  return (
    <Tag className={`system-tag ${disabled ? "system-tag-disabled" : ""}`}>
      {code}
    </Tag>
  );
}
const colors: Record<string, string> = {
  已发送: "processing",
  已接受: "warning",
  已完成: "success",
  已拒绝: "default",
  部分开通: "error",
  正常: "success",
  已注销: "default",
  已开通: "success",
};
export function StatusTag({ status }: { status: string }) {
  return (
    <Tag bordered={false} color={colors[status] || "default"}>
      <span className="status-dot" />
      {status}
    </Tag>
  );
}
export function AdminBadge() {
  return (
    <Tooltip title="客户管理员">
      <SafetyCertificateFilled
        className="admin-badge"
        aria-label="客户管理员"
      />
    </Tooltip>
  );
}
export function CopyText({
  value,
  mono = false,
}: {
  value: string;
  mono?: boolean;
}) {
  return (
    <Typography.Text
      className={mono ? "mono" : ""}
      copyable={{ text: value, tooltips: ["复制", "已复制"] }}
    >
      {value}
    </Typography.Text>
  );
}
export function CopyButton({
  value,
  label = "复制链接",
}: {
  value: string;
  label?: string;
}) {
  const { message } = App.useApp();
  return (
    <Button
      type="link"
      icon={<CopyOutlined />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          message.success("已复制到剪贴板");
        } catch {
          message.error("复制失败，请手动复制链接");
        }
      }}
    >
      {label}
    </Button>
  );
}
export function SectionTitle({
  index,
  title,
  description,
}: {
  index?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-title">
      {index && <span>{index}</span>}
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}
