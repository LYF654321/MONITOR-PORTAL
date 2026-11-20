import { useMemo, useState } from "react";
import {
  Alert,
  App,
  Button,
  Checkbox,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ArrowRightOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import {
  CopyButton,
  CopyText,
  DataTable,
  PageHeader,
  SectionTitle,
  SystemTag,
} from "@/components";
import { useAction, usePortal } from "@/hooks/usePortal";
import { api } from "@/services";
import { isMock } from "@/services/request";
import {
  inviteURL,
  matches,
  effectiveSystems,
  removeEmptySearchFields,
} from "@/utils";
import type {
  AccountQuery,
  Invitation,
  SystemCode,
  InviteSystem,
} from "@/types";

interface InviteFilters {
  phone?: string;
  email?: string;
  inviter?: string;
  dates?: [Dayjs, Dayjs];
}
interface InviteFormValues {
  phone: string;
  email: string;
  customerMode: "existing" | "new";
  customerKey?: string;
  customerName?: string;
  codes: SystemCode[];
  bindings: Partial<
    Record<SystemCode, { org: string; role: string; confirmed?: boolean }>
  >;
}
export default function Invitations() {
  const { data } = usePortal();
  const [filters, setFilters] = useState<InviteFilters>({});
  const [searchForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Invitation>();
  const invites = data!.invites;
  const rows = useMemo(
    () =>
      invites.filter(
        (i) =>
          matches(i.phone, filters.phone) &&
          matches(i.email, filters.email) &&
          matches(i.inviter, filters.inviter) &&
          (!filters.dates ||
            (dayjs(i.createdAt).valueOf() >=
              filters.dates[0].startOf("day").valueOf() &&
              dayjs(i.createdAt).valueOf() <=
                filters.dates[1].endOf("day").valueOf())),
      ),
    [invites, filters],
  );
  return (
    <>
      <PageHeader
        title="邀请管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpen(true)}
          >
            新建邀请
          </Button>
        }
      />
      <section className="content-panel">
        <Form
          name="inviteSearch"
          form={searchForm}
          layout="vertical"
          className="search-form"
          onFinish={(values: InviteFilters) =>
            setFilters(removeEmptySearchFields(values))
          }
        >
          <Form.Item name="phone" label="受邀人手机">
            <Input allowClear placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="email" label="受邀人邮箱">
            <Input allowClear placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="inviter" label="邀请人">
            <Input allowClear placeholder="请输入邀请人" />
          </Form.Item>
          <Form.Item name="dates" label="创建时间" className="search-date">
            <DatePicker.RangePicker format="YYYY-MM-DD" />
          </Form.Item>
          <div className="search-actions">
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                searchForm.resetFields();
                setFilters({});
              }}
            >
              重置
            </Button>
          </div>
        </Form>
        <div className="table-toolbar">
          <h2>
            邀请记录 <span>{rows.length}</span>
          </h2>
        </div>
        <DataTable<Invitation>
          fixedBody
          dataSource={rows}
          columns={[
            {
              title: "受邀人手机",
              dataIndex: "phone",
              width: 160,
              render: (value) => <CopyText value={value} />,
            },
            {
              title: "受邀人邮箱",
              dataIndex: "email",
              width: 220,
              render: (value) => (
                <span className="secondary-text">{value}</span>
              ),
            },
            { title: "所属客户", dataIndex: "customerName", width: 160 },
            { title: "邀请人", dataIndex: "inviter", width: 130 },
            {
              title: "创建时间",
              dataIndex: "createdAt",
              width: 185,
              sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
            },
            {
              title: "操作",
              key: "action",
              fixed: "right",
              width: 235,
              render: (_, record) => (
                <Space size={0}>
                  <Button type="link" onClick={() => setDetail(record)}>
                    查看详情
                  </Button>
                  <Divider type="vertical" />
                  <CopyButton
                    value={inviteURL(record.id)}
                    label="复制邀请链接"
                  />
                </Space>
              ),
            },
          ]}
        />
      </section>
      <InviteDrawer open={open} onClose={() => setOpen(false)} />
      <Drawer
        width={640}
        title="邀请详情"
        open={Boolean(detail)}
        onClose={() => setDetail(undefined)}
        footer={<Button onClick={() => setDetail(undefined)}>关闭</Button>}
      >
        {detail && (
          <>
            <div className="detail-heading">
              <span className="detail-icon">
                <MailOutlined />
              </span>
              <div>
                <h2>门户{detail.cid ? "登录" : "注册"}邀请</h2>
              </div>
            </div>
            <SectionTitle title="邀请信息" />
            <Descriptions
              column={1}
              items={[
                {
                  key: "phone",
                  label: "受邀人手机",
                  children: <CopyText value={detail.phone} />,
                },
                {
                  key: "email",
                  label: "受邀人邮箱",
                  children: <CopyText value={detail.email} />,
                },
                {
                  key: "customer",
                  label: "所属客户",
                  children: detail.customerName,
                },
                {
                  key: "key",
                  label: "客户 Key",
                  children: <CopyText value={detail.customerKey} mono />,
                },
                { key: "inviter", label: "邀请人", children: detail.inviter },
                {
                  key: "created",
                  label: "创建时间",
                  children: detail.createdAt,
                },
              ]}
            />
            <Divider />
            <SectionTitle title="业务系统开通配置" />
            <DataTable<InviteSystem>
              rowKey="code"
              pagination={false}
              dataSource={detail.systems}
              columns={[
                {
                  title: "业务系统",
                  dataIndex: "code",
                  render: (code) => <SystemTag code={code} />,
                },
                { title: "业务空间", dataIndex: "org" },
                { title: "角色", dataIndex: "role" },
                {
                  title: "开通结果",
                  dataIndex: "result",
                  render: (value) => value || "待完成",
                },
              ]}
            />
            <Divider />
            <SectionTitle title="邀请链接" />
            <div className="link-box">
              <Typography.Paragraph copyable={{ text: inviteURL(detail.id) }}>
                {inviteURL(detail.id)}
              </Typography.Paragraph>
              <Button
                href={inviteURL(detail.id)}
                target="_blank"
                icon={<ArrowRightOutlined />}
              >
                预览邀请页面
              </Button>
            </div>
            {isMock && (
              <Alert
                type="info"
                showIcon
                message="演示环境仅模拟邀请邮件，未发送真实邮件。"
                style={{ marginTop: 20 }}
              />
            )}
          </>
        )}
      </Drawer>
    </>
  );
}

function InviteDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, refresh } = usePortal();
  const { run, pending } = useAction();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<InviteFormValues>();
  const [accounts, setAccounts] = useState<AccountQuery[]>([]);
  const [queried, setQueried] = useState("");
  const [querying, setQuerying] = useState(false);
  const isAdmin = data!.session.kind === "admin";
  const mode = Form.useWatch("customerMode", form) || "existing";
  const key = Form.useWatch("customerKey", form);
  const codes: SystemCode[] = Form.useWatch("codes", form) || [];
  const phone = Form.useWatch("phone", form) || "";
  const target = data!.customers.find(
    (c) => c.key === (isAdmin ? key : data!.currentUser!.customerKey),
  );
  const own = data!.currentUser;
  const permitted = isAdmin
    ? data!.catalog.filter((s) => s.available)
    : data!.catalog.filter(
        (s) =>
          own && effectiveSystems(own, target).some((b) => b.code === s.code),
      );
  const available =
    mode === "new" && isAdmin
      ? permitted
      : permitted.filter((s) =>
          target?.systems.some((c) => c.code === s.code && c.enabled),
        );
  const queryStamp = JSON.stringify([
    phone,
    codes,
    isAdmin ? mode : "existing",
    target?.key,
  ]);
  const queryValid = queried === queryStamp;
  function close() {
    onClose();
    form.resetFields();
    setAccounts([]);
    setQueried("");
  }
  async function query() {
    await run(async () => {
      await form.validateFields([
        "phone",
        "codes",
        ...(isAdmin ? [mode === "new" ? "customerName" : "customerKey"] : []),
      ]);
      setQuerying(true);
      try {
        const result = await api.queryAccounts(phone, codes);
        setAccounts(result);
        setQueried(queryStamp);
        const bindings: InviteFormValues["bindings"] = {};
        for (const item of result) {
          const config = target?.systems.find((s) => s.code === item.code);
          bindings[item.code] = {
            org: item.account?.org || config?.org || "",
            role: item.account?.role || "普通用户",
            confirmed: false,
          };
        }
        form.setFieldValue("bindings", bindings);
      } finally {
        setQuerying(false);
      }
    });
  }
  return (
    <Drawer
      width={720}
      open={open}
      title="新建邀请"
      onClose={close}
      maskClosable={false}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={close}>取消</Button>
          <Button
            type="primary"
            loading={pending && !querying}
            onClick={() => form.submit()}
            icon={<MailOutlined />}
          >
            创建邀请
          </Button>
        </Space>
      }
    >
      <Alert
        showIcon
        type="info"
        message="邀请前，请先查询并确认业务系统账号信息。"
        className="drawer-notice"
      />
      <Form
        name="inviteCreate"
        form={form}
        layout="vertical"
        initialValues={{
          customerMode: "existing",
          customerKey: isAdmin ? undefined : own?.customerKey,
          codes: ["IOT"],
        }}
        onFinish={(values) =>
          run(async () => {
            if (!queryValid) {
              message.warning("请先按当前手机号和业务配置查询已有关联账号");
              return;
            }
            const systems = values.codes.map((code) => {
              const config = values.bindings[code]!;
              const local = accounts.find((a) => a.code === code)?.account;
              if (local && !config.confirmed)
                throw new Error("请确认绑定已有关联账号");
              return {
                code,
                org: config.org,
                role: config.role,
                mode: local ? ("bind" as const) : ("create" as const),
              };
            });
            const invitation = await api.createInvite({
              phone: values.phone,
              email: values.email,
              customerKey: isAdmin && mode === "new" ? undefined : target?.key,
              customerName:
                isAdmin && mode === "new" ? values.customerName : undefined,
              systems,
            });
            await refresh();
            close();
            modal.success({
              title: "邀请已创建",
              width: 540,
              content: (
                <>
                  <p>
                    {isMock
                      ? "已生成模拟邀请邮件，请复制链接体验接收邀请流程。"
                      : "邀请邮件已发送，请提醒受邀人查收。"}
                  </p>
                  <Typography.Paragraph copyable>
                    {inviteURL(invitation.id)}
                  </Typography.Paragraph>
                  <Button
                    type="primary"
                    href={inviteURL(invitation.id)}
                    target="_blank"
                  >
                    预览邀请页面
                  </Button>
                </>
              ),
            });
          })
        }
      >
        <SectionTitle
          index="01"
          title="受邀人信息"
          description="手机号用于客户中心认证，邮箱用于接收邀请。"
        />
        <div className="form-grid">
          <Form.Item
            name="phone"
            label="受邀人手机"
            rules={[
              { required: true, message: "请输入手机号" },
              { pattern: /^1\d{10}$/, message: "请输入有效手机号" },
            ]}
          >
            <Input placeholder="请输入11位手机号码" maxLength={11} />
          </Form.Item>
          <Form.Item
            name="email"
            label="受邀人邮箱"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效邮箱" },
            ]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
        </div>
        <Divider />
        <SectionTitle
          index="02"
          title="所属客户"
          description="同一客户下的用户共享客户 Key。"
        />
        {isAdmin ? (
          <>
            <Form.Item name="customerMode">
              <Radio.Group
                options={[
                  { label: "已有客户", value: "existing" },
                  { label: "新建客户", value: "new" },
                ]}
                onChange={() => {
                  form.setFieldValue("codes", ["IOT"]);
                  setQueried("");
                }}
              />
            </Form.Item>
            {mode === "new" ? (
              <Form.Item
                name="customerName"
                label="客户名称"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "请输入客户名称",
                  },
                  { max: 50, message: "最多50个字符" },
                ]}
              >
                <Input maxLength={50} showCount placeholder="请输入客户名称" />
              </Form.Item>
            ) : (
              <Form.Item
                name="customerKey"
                label="选择客户"
                rules={[{ required: true, message: "请选择客户" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="按客户名称或 Key 搜索"
                  options={data!.customers.map((c) => ({
                    value: c.key,
                    label: `${c.name} · ${c.key}`,
                  }))}
                />
              </Form.Item>
            )}
          </>
        ) : (
          <div className="customer-summary">
            <strong>{target?.name}</strong>
            <CopyText value={target?.key || ""} mono />
          </div>
        )}
        <Divider />
        <SectionTitle
          index="03"
          title="业务系统开通配置"
          description="仅可邀请进入客户已开通的系统与业务空间。"
        />
        <Form.Item
          name="codes"
          label="选择业务系统"
          rules={[
            {
              required: true,
              type: "array",
              min: 1,
              message: "请选择至少一个已开通的业务系统",
            },
          ]}
        >
          <Checkbox.Group
            options={data!.catalog.map((s) => ({
              label: `${s.code} · ${s.name}${s.available ? "" : "（待接入）"}`,
              value: s.code,
              disabled: !available.some((a) => a.code === s.code),
            }))}
          />
        </Form.Item>
        {mode === "existing" && target && !available.length && (
          <Alert
            type="warning"
            showIcon
            message="该客户暂无可用系统，请先完成客户业务系统配置。"
          />
        )}
        <Button
          block
          icon={<SearchOutlined />}
          loading={querying}
          onClick={query}
        >
          查询已有关联账号
        </Button>
        {!queryValid && queried && (
          <Alert
            style={{ marginTop: 12 }}
            showIcon
            type="warning"
            message="邀请信息已变化，请重新查询关联账号。"
          />
        )}
        {queryValid &&
          accounts.map((item) => {
            const local = item.account;
            const system = data!.catalog.find((s) => s.code === item.code)!;
            const config = target?.systems.find((s) => s.code === item.code);
            const conflict = Boolean(
              local &&
              ((mode !== "new" && config && local.org !== config.org) ||
                local.status !== "正常"),
            );
            const allowedRoles =
              !isAdmin &&
              own?.systems.find((s) => s.code === item.code)?.role !==
                "租户管理员"
                ? [own!.systems.find((s) => s.code === item.code)!.role]
                : system.roles;
            return (
              <div className="system-config" key={item.code}>
                <div className="system-config-heading">
                  <SystemTag code={item.code} />
                  <strong>{system.name}</strong>
                  <Tag bordered={false} color={local ? "blue" : "green"}>
                    {local ? "已有关联账号" : "将创建新账号"}
                  </Tag>
                </div>
                {local && (
                  <Descriptions
                    size="small"
                    column={1}
                    items={[
                      { key: "phone", label: "手机号", children: local.phone },
                      { key: "email", label: "邮箱", children: local.email },
                      {
                        key: "status",
                        label: "账号状态",
                        children: local.status,
                      },
                    ]}
                  />
                )}
                <div className="form-grid">
                  <Form.Item
                    name={["bindings", item.code, "org"]}
                    label="业务空间"
                    rules={[{ required: true, message: "请选择业务空间" }]}
                  >
                    <Select
                      disabled={Boolean(local) || mode === "existing"}
                      placeholder="请选择业务空间"
                      options={(config && mode !== "new"
                        ? [config.org]
                        : system.spaces
                      ).map((value) => ({ value, label: value }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name={["bindings", item.code, "role"]}
                    label="业务角色"
                    rules={[{ required: true, message: "请选择角色" }]}
                  >
                    <Select
                      disabled={Boolean(local)}
                      options={allowedRoles.map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                  </Form.Item>
                </div>
                {conflict ? (
                  <Alert
                    type="error"
                    showIcon
                    message="账号空间或状态不符合本次安排，请先在业务系统处理后重新邀请。"
                  />
                ) : local ? (
                  <Form.Item
                    name={["bindings", item.code, "confirmed"]}
                    valuePropName="checked"
                    rules={[
                      {
                        validator: (_, value) =>
                          value
                            ? Promise.resolve()
                            : Promise.reject(new Error("请确认账号绑定")),
                      },
                    ]}
                  >
                    <Checkbox>
                      已核对空间、角色与账号状态，确认绑定此账号
                    </Checkbox>
                  </Form.Item>
                ) : (
                  <p className="muted-text">
                    受邀人完成身份认证后，将按上述配置创建业务系统账号。
                  </p>
                )}
              </div>
            );
          })}
      </Form>
    </Drawer>
  );
}
