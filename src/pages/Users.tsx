import { useState } from "react";
import {
  Alert,
  App,
  Avatar,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  AdminBadge,
  CopyText,
  DataTable,
  PageHeader,
  SectionTitle,
  SystemTag,
} from "@/components";
import { useAction, usePortal } from "@/hooks/usePortal";
import { api } from "@/services";
import { effectiveSystems, matches, removeEmptySearchFields } from "@/utils";
import type { PortalUser, SystemCode } from "@/types";
interface UserFilters {
  account?: string;
  phone?: string;
  email?: string;
  customerKey?: string;
}
export default function Users() {
  const { data, refresh } = usePortal();
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<UserFilters>({});
  const [selected, setSelected] = useState<string>();
  const rows = data!.users.filter(
    (u) =>
      u.status === "正常" &&
      matches(`${u.account} ${u.name}`, filters.account) &&
      matches(u.phone, filters.phone) &&
      matches(u.email, filters.email) &&
      matches(u.customerKey, filters.customerKey),
  );
  const managed = data!.users.find((u) => u.id === selected);
  return (
    <>
      <PageHeader title="用户管理" />
      <section className="content-panel">
        <Form
          name="userSearch"
          form={form}
          layout="vertical"
          className="search-form user-search"
          onFinish={(values: UserFilters) =>
            setFilters(removeEmptySearchFields(values))
          }
        >
          <Form.Item name="account" label="用户账号">
            <Input allowClear placeholder="请输入账号或姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input allowClear placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input allowClear placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="customerKey" label="客户 Key">
            <Input allowClear placeholder="请输入客户 Key" />
          </Form.Item>
          <div className="search-actions">
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                form.resetFields();
                setFilters({});
              }}
            >
              重置
            </Button>
          </div>
        </Form>
        <div className="table-toolbar">
          <h2>
            用户列表 <span>{rows.length}</span>
          </h2>
        </div>
        <DataTable<PortalUser>
          fixedBody
          dataSource={rows}
          columns={[
            {
              title: "用户账号",
              dataIndex: "account",
              width: 190,
              render: (_, u) => (
                <div className="table-name">
                  <Avatar className="person-avatar">
                    {u.name.slice(0, 1)}
                  </Avatar>
                  <div>
                    <strong>
                      {u.account} {u.admin && <AdminBadge />}
                    </strong>
                    <small>{u.name}</small>
                  </div>
                </div>
              ),
            },
            {
              title: "手机号",
              dataIndex: "phone",
              width: 160,
              render: (value) => <CopyText value={value} />,
            },
            {
              title: "邮箱",
              dataIndex: "email",
              width: 230,
              render: (value) => <CopyText value={value} />,
            },
            {
              title: "客户 Key",
              dataIndex: "customerKey",
              width: 200,
              render: (value) => <CopyText value={value} mono />,
            },
            {
              title: "已开通业务系统",
              key: "systems",
              width: 180,
              render: (_, u) => {
                const codes = effectiveSystems(
                  u,
                  data!.customers.find((c) => c.key === u.customerKey),
                );
                return codes.length ? (
                  codes.map((s) => <SystemTag key={s.code} code={s.code} />)
                ) : (
                  <span className="muted-text">—</span>
                );
              },
            },
            {
              title: "操作",
              key: "action",
              width: 225,
              fixed: "right",
              render: (_, u) => (
                <Space size={0}>
                  <Button type="link" onClick={() => setSelected(u.id)}>
                    业务系统管理
                  </Button>
                  <Divider type="vertical" />
                  <Button
                    danger
                    type="link"
                    onClick={() =>
                      modal.confirm({
                        title: "确认注销用户？",
                        content: (
                          <>
                            <p>
                              {u.name}（{u.account}）
                            </p>
                            <p>
                              注销后，该用户将失去门户登录资格，需重新接受邀请才能进入。客户中心和业务系统原有数据保留。
                            </p>
                          </>
                        ),
                        okText: "确认注销",
                        okButtonProps: { danger: true },
                        cancelText: "取消",
                        onOk: async () => {
                          await api.revokeUser(u.id);
                          await refresh();
                        },
                      })
                    }
                  >
                    注销
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </section>
      {managed && (
        <UserSystems user={managed} onClose={() => setSelected(undefined)} />
      )}
    </>
  );
}
function UserSystems({
  user,
  onClose,
}: {
  user: PortalUser;
  onClose: () => void;
}) {
  const { data, refresh } = usePortal();
  const { run, pending } = useAction();
  const customer = data!.customers.find((c) => c.key === user.customerKey)!;
  const [roles, setRoles] = useState<Partial<Record<SystemCode, string>>>({});
  function toggle(code: SystemCode, enabled: boolean) {
    void run(
      async () => {
        await api.saveUserSystem(
          user.id,
          code,
          enabled,
          roles[code] || "普通用户",
        );
        await refresh();
      },
      enabled ? "用户入口已开通" : "用户入口已关闭",
    );
  }
  return (
    <Drawer
      open
      width={640}
      title="用户业务系统管理"
      onClose={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
    >
      <div className="profile-strip">
        <Avatar size={48} className="person-avatar">
          {user.name.slice(0, 1)}
        </Avatar>
        <div>
          <h2>
            {user.name} {user.admin && <AdminBadge />}
          </h2>
          <p>
            {user.account} · {user.phone}
          </p>
        </div>
      </div>
      <Descriptions
        column={1}
        size="small"
        items={[
          { key: "customer", label: "所属客户", children: customer.name },
          {
            key: "key",
            label: "客户 Key",
            children: <CopyText value={customer.key} mono />,
          },
        ]}
      />
      <Alert
        type="info"
        showIcon
        className="drawer-notice"
        message="入口授权与业务系统内部权限分别管理。"
        description="关闭入口保留原有账号绑定关系；恢复时将重新校验账号状态与空间。"
      />
      <SectionTitle title="业务系统入口" />
      {customer.systems.length === 0 && (
        <Alert
          type="warning"
          showIcon
          message="客户暂无已配置的业务系统，请联系门户管理员。"
        />
      )}
      {customer.systems.map((config) => {
        const binding = user.systems.find((s) => s.code === config.code);
        const system = data!.catalog.find((s) => s.code === config.code)!;
        const effective = effectiveSystems(user, customer).some(
          (s) => s.code === config.code,
        );
        const allowedRoles = system.roles;
        return (
          <div className="system-config" key={config.code}>
            <div className="system-config-heading">
              <SystemTag code={config.code} />
              <strong>{system.name}</strong>
              <Tooltip
                title={
                  !config.enabled
                    ? "客户已关闭该系统"
                    : !binding?.bound
                      ? "开通时将校验并绑定业务账号"
                      : undefined
                }
              >
                <Switch
                  checked={config.enabled && Boolean(binding?.enabled)}
                  disabled={!config.enabled || pending}
                  loading={pending}
                  aria-label={`${config.code}用户入口`}
                  onChange={(enabled) => toggle(config.code, enabled)}
                />
              </Tooltip>
            </div>
            <Descriptions
              column={2}
              size="small"
              items={[
                { key: "org", label: "业务空间", children: config.org },
                {
                  key: "role",
                  label: "角色",
                  children: binding?.role || "未配置",
                },
                {
                  key: "bind",
                  label: "账号绑定",
                  children: binding?.bound ? (
                    <Tag color="success" bordered={false}>
                      已绑定
                    </Tag>
                  ) : (
                    <Tag bordered={false}>未绑定</Tag>
                  ),
                },
                {
                  key: "state",
                  label: "当前入口",
                  children: effective
                    ? "可进入"
                    : config.enabled
                      ? "未开通或绑定异常"
                      : "客户已关闭",
                },
              ]}
            />
            {!binding?.bound && config.enabled && (
              <Form layout="vertical">
                <Form.Item label="开通角色">
                  <Select
                    value={roles[config.code] || "普通用户"}
                    onChange={(value) =>
                      setRoles({ ...roles, [config.code]: value })
                    }
                    options={allowedRoles.map((value) => ({
                      label: value,
                      value,
                    }))}
                  />
                </Form.Item>
              </Form>
            )}
            {!config.enabled && (
              <Alert
                type="warning"
                showIcon
                message="客户已关闭该系统，原有用户授权保留。"
              />
            )}
          </div>
        );
      })}
    </Drawer>
  );
}
