import { useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Divider,
  Drawer,
  Empty,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import {
  ApartmentOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { AdminBadge, CopyText, DataTable, PageHeader, SectionTitle, SystemTag } from '@/components';
import { useAction, usePortal } from '@/hooks/usePortal';
import { api } from '@/services';
import { matches } from '@/utils';
import type { Customer, CustomerSystem } from '@/types';
export default function Customers() {
  const { data } = usePortal();
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState<Customer>();
  const [adminTarget, setAdminTarget] = useState<Customer>();
  const rows = data!.customers.filter((c) => matches(`${c.name} ${c.key}`, search));
  return (
    <>
      <PageHeader title="客户管理" />
      <section className="content-panel">
        <div className="compact-search">
          <div>
            <label>客户名称 / Key</label>
            <Input
              allowClear
              placeholder="请输入客户名称或 Key"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={() => setSearch(input)}
              style={{ width: 300 }}
            />
          </div>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => setSearch(input)}>
            查询
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setInput('');
              setSearch('');
            }}
          >
            重置
          </Button>
        </div>
        <div className="table-toolbar">
          <h2>
            客户列表 <span>{rows.length}</span>
          </h2>
        </div>
        <DataTable<Customer>
          fixedBody
          rowKey="key"
          dataSource={rows}
          columns={[
            {
              title: '客户名称',
              dataIndex: 'name',
              width: 240,
              render: (value, record) => (
                <div className="table-name">
                  <Avatar shape="square" className="customer-avatar" icon={<ApartmentOutlined />} />
                  <div>
                    <strong>{value}</strong>
                    <small>
                      {
                        data!.users.filter(
                          (u) => u.customerKey === record.key && u.status === '正常',
                        ).length
                      }{' '}
                      位用户
                    </small>
                  </div>
                </div>
              ),
            },
            {
              title: '客户 Key',
              dataIndex: 'key',
              width: 240,
              render: (value) => <CopyText value={value} mono />,
            },
            {
              title: '已绑定业务系统',
              dataIndex: 'systems',
              width: 200,
              render: (systems: CustomerSystem[]) =>
                systems.length ? (
                  <Space>
                    {systems.map((s) => (
                      <Tooltip key={s.code} title={s.enabled ? '已开启' : '入口已关闭'}>
                        <span>
                          <SystemTag code={s.code} disabled={!s.enabled} />
                        </span>
                      </Tooltip>
                    ))}
                  </Space>
                ) : (
                  <span className="muted-text">—</span>
                ),
            },
            {
              title: '客户管理员',
              key: 'admins',
              width: 200,
              render: (_, record) => (
                <Space wrap>
                  {data!.users
                    .filter((u) => u.customerKey === record.key && u.admin && u.status === '正常')
                    .map((u) => (
                      <Tag bordered={false} key={u.id}>
                        <UserOutlined /> {u.name}
                      </Tag>
                    ))}
                </Space>
              ),
            },
            {
              title: '操作',
              key: 'action',
              width: 285,
              fixed: 'right',
              render: (_, record) => (
                <Space size={0}>
                  <Button type="link" icon={<SettingOutlined />} onClick={() => setEditing(record)}>
                    业务系统配置
                  </Button>
                  <Divider type="vertical" />
                  <Button
                    type="link"
                    icon={<TeamOutlined />}
                    onClick={() => setAdminTarget(record)}
                  >
                    配置管理员
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </section>
      {editing && <CustomerSystems target={editing} onClose={() => setEditing(undefined)} />}
      {adminTarget && (
        <CustomerAdmins target={adminTarget} onClose={() => setAdminTarget(undefined)} />
      )}
    </>
  );
}
function CustomerSystems({ target, onClose }: { target: Customer; onClose: () => void }) {
  const { data, refresh } = usePortal();
  const { run, pending } = useAction();
  const [systems, setSystems] = useState<CustomerSystem[]>(target.systems.map((s) => ({ ...s })));
  const [adminRole, setAdminRole] = useState('普通用户');
  const remaining = data!.catalog.filter(
    (s) => s.available && !systems.some((c) => c.code === s.code),
  );
  return (
    <Drawer
      open
      width={640}
      title="客户业务系统配置"
      onClose={onClose}
      maskClosable={false}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            loading={pending}
            onClick={() =>
              run(async () => {
                await api.saveCustomerSystems(target.key, systems, adminRole);
                await refresh();
                onClose();
              }, '业务系统配置已保存')
            }
          >
            保存配置
          </Button>
        </Space>
      }
    >
      <div className="customer-summary">
        <Avatar className="customer-avatar" shape="square" size={46} icon={<ApartmentOutlined />} />
        <div>
          <h3>{target.name}</h3>
          <CopyText value={target.key} mono />
        </div>
      </div>
      <Alert
        type="info"
        showIcon
        className="drawer-notice"
        message="关闭系统后，客户下所有用户的该系统入口统一关闭。"
        description="账号绑定和原授权保留，重新开启后按原有效授权恢复。"
      />
      <SectionTitle title="已配置业务系统" />
      {!systems.length && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无已配置业务系统" />
      )}
      {systems.map((item, index) => {
        const system = data!.catalog.find((s) => s.code === item.code)!;
        const existing = target.systems.some((s) => s.code === item.code);
        return (
          <div className="system-config" key={item.code}>
            <div className="system-config-heading">
              <SystemTag code={item.code} />
              <strong>{system.name}</strong>
              <Switch
                checked={item.enabled}
                checkedChildren="开启"
                unCheckedChildren="关闭"
                onChange={(enabled) =>
                  setSystems(systems.map((s, i) => (i === index ? { ...s, enabled } : s)))
                }
              />
            </div>
            <Form layout="vertical">
              <Form.Item
                label="业务空间"
                required
                help={existing ? '已绑定的业务空间不支持更换' : undefined}
              >
                <Select
                  value={item.org || undefined}
                  disabled={existing}
                  placeholder="请选择业务空间"
                  onChange={(org) =>
                    setSystems(systems.map((s, i) => (i === index ? { ...s, org } : s)))
                  }
                  options={system.spaces.map((value) => ({ value, label: value }))}
                />
              </Form.Item>
              {!existing && (
                <Form.Item label="客户管理员开通角色" required>
                  <Select
                    value={adminRole}
                    onChange={setAdminRole}
                    options={system.roles.map((value) => ({ value, label: value }))}
                  />
                </Form.Item>
              )}
            </Form>
            {existing && (
              <p className="muted-text">
                该设置影响整个客户的入口可用状态，用户原有角色与业务数据继续保留。
              </p>
            )}
          </div>
        );
      })}
      {remaining.length > 0 && (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          block
          onClick={() =>
            setSystems([...systems, { code: remaining[0].code, org: '', enabled: true }])
          }
        >
          新增业务系统配置
        </Button>
      )}
      <Divider />
      <SectionTitle title="后续接入" />
      <div className="future-list">
        {data!.catalog
          .filter((s) => !s.available)
          .map((s) => (
            <div key={s.code}>
              <span className="system-code-small">{s.code}</span>
              <span>{s.name}</span>
              <Tag bordered={false}>待接入</Tag>
            </div>
          ))}
      </div>
    </Drawer>
  );
}
function CustomerAdmins({ target, onClose }: { target: Customer; onClose: () => void }) {
  const { data, refresh } = usePortal();
  const { run, pending } = useAction();
  const users = data!.users.filter((u) => u.customerKey === target.key && u.status === '正常');
  const [selected, setSelected] = useState(users.filter((u) => u.admin).map((u) => u.id));
  return (
    <Drawer
      open
      width={560}
      title="配置客户管理员"
      onClose={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            disabled={!users.length}
            loading={pending}
            onClick={() =>
              run(async () => {
                await api.saveAdmins(target.key, selected);
                await refresh();
                onClose();
              }, '客户管理员已更新')
            }
          >
            保存
          </Button>
        </Space>
      }
    >
      <div className="customer-summary">
        <strong>{target.name}</strong>
        <CopyText value={target.key} mono />
      </div>
      <Alert
        showIcon
        type="info"
        className="drawer-notice"
        message="管理员拥有该客户下的用户管理权限。"
        description="管理员从当前客户的有效用户中指定，不改变业务系统中已有的角色。"
      />
      <Form layout="vertical">
        <Form.Item label="选择客户管理员" required>
          <Select
            mode="multiple"
            showSearch
            optionFilterProp="label"
            value={selected}
            onChange={setSelected}
            placeholder="请选择客户管理员"
            options={users.map((u) => ({
              value: u.id,
              label: `${u.name} (${u.account}) · ${u.phone}`,
            }))}
          />
        </Form.Item>
      </Form>
      {!users.length && (
        <Empty
          description="暂无有效用户，请先通过邀请开通客户用户"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
      <div className="admin-preview">
        {users
          .filter((u) => selected.includes(u.id))
          .map((u) => (
            <div key={u.id}>
              <Avatar icon={<UserOutlined />} />
              <div>
                <strong>
                  {u.name} <AdminBadge />
                </strong>
                <p>{u.phone}</p>
              </div>
            </div>
          ))}
      </div>
    </Drawer>
  );
}
