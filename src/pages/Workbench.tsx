import { history } from '@umijs/max';
import { Alert, Avatar, Button, Descriptions, Divider, Space, Tag } from 'antd';
import {
  ApiOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CloudServerOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AdminBadge, CopyText, PageHeader, SystemTag } from '@/components';
import masLogo from '@/assets/system-mas.png';
import iotLogo from '@/assets/system-iot.png';
import dorsLogo from '@/assets/system-dors.png';
import dtsLogo from '@/assets/system-dts.png';
import { useAction, usePortal } from '@/hooks/usePortal';
import { api } from '@/services';
import { effectiveSystems } from '@/utils';
import type { SystemCode } from '@/types';
const systemLogos = {
  IOT: iotLogo,
  MAS: masLogo,
  DORS: dorsLogo,
  DTS: dtsLogo,
};
export default function Workbench() {
  const { data } = usePortal();
  const { run, pending } = useAction();
  const user = data!.currentUser!;
  const customer = data!.customers.find((c) => c.key === user.customerKey)!;
  const systems = effectiveSystems(user, customer);
  const hour = dayjs().hour();
  const greeting = hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';
  function enter(code: SystemCode) {
    void run(async () => {
      const ticket = await api.ticket(code);
      window.location.assign(ticket.url);
    });
  }
  return (
    <>
      <PageHeader title="工作台" />
      <section className="welcome-panel">
        <div>
          <span className="welcome-label">欢迎回来</span>
          <h2>
            {greeting}，{user.name}
            <span className="greeting-dot">。</span>
          </h2>
          <p>您的监测业务，从这里开始。</p>
          <Space>
            <Tag icon={<SafetyCertificateOutlined />} bordered={false}>
              {user.admin ? '客户管理员' : '客户用户'}
            </Tag>
            <span className="welcome-customer">{customer.name}</span>
          </Space>
        </div>
        <div className="welcome-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="welcome-platform">
            <ApiOutlined />
          </span>
          <span className="orbit-node node-one">
            <DatabaseOutlined />
          </span>
          <span className="orbit-node node-two">
            <CloudServerOutlined />
          </span>
          <span className="orbit-node node-three">
            <CheckCircleFilled />
          </span>
        </div>
      </section>
      <div className="workbench-grid">
        <section className="content-panel systems-panel">
          <div className="table-toolbar">
            <h2>
              我的业务系统 <span>{systems.length}</span>
            </h2>
            <span className="muted-text">已开通且绑定有效的系统可直接进入</span>
          </div>
          {data!.catalog
            .filter((s) => s.available)
            .map((system) => {
              const binding = systems.find((s) => s.code === system.code);
              const original = user.systems.find((s) => s.code === system.code);
              const config = customer.systems.find((s) => s.code === system.code);
              return (
                <div
                  className={`business-card ${binding ? '' : 'business-card-disabled'}`}
                  key={system.code}
                >
                  <div className="business-card-top">
                    <span className="business-icon">
                      <img src={systemLogos[system.code]} alt={`${system.code} 系统 Logo`} />
                    </span>
                    <div>
                      <h3>
                        {system.name} <SystemTag code={system.code} />
                      </h3>
                      <p>{system.description}</p>
                    </div>
                    <Tag color={binding ? 'success' : 'default'} bordered={false}>
                      {binding ? '已开通' : config && !config.enabled ? '客户已关闭' : '未开通'}
                    </Tag>
                  </div>
                  <Divider />
                  <div className="business-details">
                    <div>
                      <span>业务空间</span>
                      <strong>{original?.org || config?.org || '尚未配置'}</strong>
                    </div>
                    <div>
                      <span>业务角色</span>
                      <strong>{original?.role || '尚未配置'}</strong>
                    </div>
                  </div>
                  <Button
                    type={binding ? 'primary' : 'default'}
                    disabled={!binding}
                    loading={pending}
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    onClick={() => enter(system.code)}
                  >
                    {binding ? '进入业务系统' : '请联系管理员开通'}
                  </Button>
                </div>
              );
            })}
          <div className="coming-soon">
            <h3>更多业务系统，陆续接入</h3>
            <div>
              {data!.catalog
                .filter((s) => !s.available)
                .map((system) => (
                  <div className="future-system" key={system.code}>
                    <span className="future-system-logo">
                      <img src={systemLogos[system.code]} alt={`${system.code} 系统 Logo`} />
                    </span>
                    <strong>{system.code}</strong>
                    <p>{system.name}</p>
                    <Tag bordered={false}>待接入</Tag>
                  </div>
                ))}
            </div>
          </div>
        </section>
        <aside className="content-panel profile-panel">
          <div className="table-toolbar">
            <h2>我的信息</h2>
            <UserOutlined />
          </div>
          <div className="profile-identity">
            <Avatar size={62} className="person-avatar">
              {user.name.slice(0, 1)}
            </Avatar>
            <h3>
              {user.name} {user.admin && <AdminBadge />}
            </h3>
            <span>{user.account}</span>
          </div>
          <Descriptions
            column={1}
            layout="vertical"
            items={[
              { key: 'phone', label: '手机号', children: <CopyText value={user.phone} /> },
              { key: 'email', label: '邮箱', children: <CopyText value={user.email} /> },
              { key: 'customer', label: '所属客户', children: customer.name },
              { key: 'key', label: '客户 Key', children: <CopyText value={customer.key} mono /> },
            ]}
          />
          <Alert
            type="info"
            showIcon
            message="业务权限独立管理"
            description="门户负责系统入口，项目、设备与数据权限由业务系统继续管理。"
          />
        </aside>
      </div>
    </>
  );
}
