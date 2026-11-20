import { useEffect, useRef, useState } from 'react';
import { history } from '@umijs/max';
import { Alert, Button, Descriptions, Dropdown, Result, Space, Spin, Tag } from 'antd';
import { ApiOutlined, AppstoreOutlined, ArrowLeftOutlined, DownOutlined } from '@ant-design/icons';
import { Brand } from '@/components';
import { api } from '@/services';
import { useAction, usePortal } from '@/hooks/usePortal';
import { effectiveSystems } from '@/utils';
import type { PortalUser, SystemInfo } from '@/types';
export default function IotDemo() {
  const [result, setResult] = useState<{ user: PortalUser; system: SystemInfo }>();
  const [error, setError] = useState('');
  const promise = useRef<ReturnType<typeof api.consumeTicket>>();
  const { run } = useAction();
  const { data } = usePortal();
  const systems = data?.currentUser
    ? effectiveSystems(
        data.currentUser,
        data.customers.find((c) => c.key === data.currentUser!.customerKey),
      )
    : [];
  useEffect(() => {
    let alive = true;
    if (!promise.current)
      promise.current = api.consumeTicket(
        new URLSearchParams(window.location.search).get('ticket') || '',
      );
    promise.current
      .then((value) => {
        if (alive) setResult(value);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div className="public-page">
      <header className="public-header">
        <Brand />
        <Space>
          {systems.length > 0 && (
            <Dropdown
              menu={{
                items: systems.map((system) => ({
                  key: system.code,
                  label: `${system.code} · ${data!.catalog.find((s) => s.code === system.code)!.name}`,
                  icon: <ApiOutlined />,
                  onClick: () =>
                    run(async () => {
                      const value = await api.ticket(system.code);
                      window.location.assign(value.url);
                    }),
                })),
              }}
            >
              <Button icon={<AppstoreOutlined />}>
                业务系统切换 <DownOutlined />
              </Button>
            </Dropdown>
          )}
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/workbench')}>
            返回门户
          </Button>
        </Space>
      </header>
      <main className="public-main">
        <section className="invitation-card">
          {error ? (
            <Result
              status="error"
              title="无法进入业务系统"
              subTitle={error}
              extra={
                <Button type="primary" onClick={() => history.push('/workbench')}>
                  从工作台重新进入
                </Button>
              }
            />
          ) : !result ? (
            <div className="public-loading">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Result
                status="success"
                title="IOT 登录票据校验通过"
                subTitle="已完成一次性票据、用户身份、入口授权与本地账号绑定的模拟校验。"
              />
              <Alert
                type="info"
                showIcon
                message="这是 IOT 接入演示页面"
                description="当前未连接真实 IOT 服务。正式接入后，将由 IOT 校验后建立原有登录会话。"
              />
              <Descriptions
                style={{ marginTop: 24 }}
                column={1}
                items={[
                  { key: 'user', label: '用户', children: result.user.account },
                  {
                    key: 'org',
                    label: '业务空间',
                    children: result.user.systems.find((s) => s.code === 'IOT')?.org,
                  },
                  {
                    key: 'role',
                    label: '业务角色',
                    children: result.user.systems.find((s) => s.code === 'IOT')?.role,
                  },
                  {
                    key: 'ticket',
                    label: '登录票据',
                    children: <Tag color="success">已消费 · 不可重复使用</Tag>,
                  },
                ]}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
